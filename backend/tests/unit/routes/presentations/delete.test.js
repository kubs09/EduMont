import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { classChildren, classTeachers, presentations } from '#backend/db/schema.js';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), transaction: jest.fn() };
const realtimeMock = { publishEvent: jest.fn() };

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

jest.unstable_mockModule('#backend/utils/realtime.js', () => ({
  __esModule: true,
  publishEvent: realtimeMock.publishEvent,
}));

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const makeTxMock = () => ({ select: jest.fn(), delete: jest.fn(), update: jest.fn() });

describe('DELETE /api/presentations/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/presentations/1');

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-numeric id, without ever opening a transaction', async () => {
    const res = await request(app)
      .delete('/api/presentations/abc')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid presentation ID' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('404 when the presentation does not exist', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/presentations/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'presentation not found' });
    expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
  });

  test("403 when the caller can't edit this presentation", async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ childId: 5, category: null, classId: 7 }]));

    // Build a chain for the canEditChildpresentation join that captures the
    // exact `where` condition it was built with, instead of ignoring
    // arguments like makeChain does. This proves the route queried
    // permissions for the childId (5) that came back from the existence
    // check, using the caller's own id (9).
    let capturedCondition;
    const permissionChain = {
      from: jest.fn(() => permissionChain),
      innerJoin: jest.fn(() => permissionChain),
      where: jest.fn((condition) => {
        capturedCondition = condition;
        return permissionChain;
      }),
      limit: jest.fn(() => Promise.resolve([])), // permission denied
    };
    dbMock.select.mockReturnValueOnce(permissionChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/presentations/1')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

    expect(res.status).toBe(403);
    expect(tx.delete).not.toHaveBeenCalled();
    expect(capturedCondition).toEqual(
      and(eq(classTeachers.teacherId, 9), eq(classChildren.childId, 5))
    );
  });

  test('200 happy path', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ childId: 5, category: null, classId: 7 }]));
    tx.delete.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'presentation entry deleted successfully' });
    // category was null, so normalizeDisplayOrder no-ops: only the existence check hit tx.select.
    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(realtimeMock.publishEvent).toHaveBeenCalledWith('class:7', 'presentation_changed', {
      classId: 7,
    });
  });

  test('200 renumbers remaining presentations in the same category via normalizeDisplayOrder', async () => {
    const tx = makeTxMock();
    tx.select
      .mockReturnValueOnce(makeChain([{ childId: 5, category: 'Practical Life', classId: 7 }])) // existence check
      .mockReturnValueOnce(makeChain([{ id: 10 }, { id: 11 }])); // normalizeDisplayOrder: remaining rows, ordered by displayOrder, id
    tx.delete.mockReturnValueOnce(makeChain([]));

    // Hand-built update chain that captures the set()/where() arguments for
    // each call, so we can prove normalizeDisplayOrder's renumbering loop
    // actually ran with the right values instead of just counting calls.
    const updateSetCalls = [];
    const updateWhereCalls = [];
    tx.update.mockImplementation(() => ({
      set: jest.fn((setArg) => {
        updateSetCalls.push(setArg);
        return {
          where: jest.fn((whereArg) => {
            updateWhereCalls.push(whereArg);
            return Promise.resolve([]);
          }),
        };
      }),
    }));

    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'presentation entry deleted successfully' });
    // Two selects prove normalizeDisplayOrder ran (existence check + its own fetch).
    expect(tx.select).toHaveBeenCalledTimes(2);
    // The loop renumbers every row it fetched, in order, to index+1.
    expect(tx.update).toHaveBeenCalledTimes(2);
    expect(updateSetCalls[0]).toEqual({ displayOrder: 1, updatedAt: expect.any(Date) });
    expect(updateWhereCalls[0]).toEqual(eq(presentations.id, 10));
    expect(updateSetCalls[1]).toEqual({ displayOrder: 2, updatedAt: expect.any(Date) });
    expect(updateWhereCalls[1]).toEqual(eq(presentations.id, 11));
  });

  test('500 when the transaction throws an unexpected error', async () => {
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .delete('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(500);
  });
});
