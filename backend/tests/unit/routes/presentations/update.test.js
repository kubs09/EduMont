import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { classChildren, classTeachers } from '#backend/db/schema.js';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), transaction: jest.fn() };

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const makeTxMock = () => ({ select: jest.fn(), update: jest.fn() });

const validUpdate = { child_id: 10, class_id: 20, name: 'Pouring Exercise' };

describe('PUT /api/presentations/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).put('/api/presentations/1').send(validUpdate);

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-numeric id, without ever opening a transaction', async () => {
    const res = await request(app)
      .put('/api/presentations/abc')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid presentation ID' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when child_id is missing', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, child_id: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when child_id is not an integer', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, child_id: 'abc' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when class_id is missing', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, class_id: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when class_id is not an integer', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, class_id: 'abc' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when name is missing', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, name: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when status is invalid', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, status: 'not-a-status' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when name exceeds 200 characters', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, name: 'a'.repeat(201) });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when category exceeds 100 characters', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, category: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when notes exceeds 1000 characters', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, notes: 'a'.repeat(1001) });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('404 when the presentation does not exist', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'presentation not found' });
  });

  test("403 when the caller can't edit the new child_id, not the previous one", async () => {
    const tx = makeTxMock();
    // Existence check reports the presentation currently belongs to child 5;
    // the request body (validUpdate) asks to move it to child 10.
    tx.select.mockReturnValueOnce(makeChain([{ childId: 5, category: null }]));

    // Build a chain for the canEditChildpresentation join that captures the
    // exact `where` condition it was built with, instead of ignoring
    // arguments like makeChain does. This lets us prove the route queried
    // permissions for the NEW child_id (10) and not previousChildId (5): if
    // the route were regressed to check previousChildId instead, the
    // captured condition below would not match the expected one.
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
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
      .send(validUpdate);

    expect(res.status).toBe(403);
    expect(capturedCondition).toEqual(
      and(eq(classTeachers.teacherId, 9), eq(classChildren.childId, 10))
    );
  });

  test('400 when the child is not assigned to the class', async () => {
    const tx = makeTxMock();
    tx.select
      .mockReturnValueOnce(makeChain([{ childId: 5, category: null }])) // existence check
      .mockReturnValueOnce(makeChain([])); // classChildren check
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
  });

  test('200 when only the category changes: previous-category renormalization runs', async () => {
    const tx = makeTxMock();
    // child_id is unchanged (stays 10, matching validUpdate) — only category changes.
    const updatedRow = { id: 1, childId: 10, classId: 20, category: 'New Category' };
    tx.select
      .mockReturnValueOnce(makeChain([{ childId: 10, category: 'Old Category' }])) // existence check
      .mockReturnValueOnce(makeChain([{ classId: 20 }])) // classChildren check
      .mockReturnValueOnce(makeChain([{ id: 1, status: 'to be presented' }])) // normalizeCategoryOrdering(new category) — already desired, no update
      .mockReturnValueOnce(makeChain([])); // normalizeCategoryOrdering(previous category) — no rows left, no-op
    tx.update.mockReturnValueOnce(makeChain([updatedRow]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, category: 'New Category', status: 'to be presented' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedRow);
    // 4 selects proves the previous-category renormalization ran even though
    // child_id itself didn't change — i.e. the category-changed disjunct alone
    // is sufficient to trigger it.
    expect(tx.select).toHaveBeenCalledTimes(4);
    // Only the route's own field update touched tx.update; neither normalizeCategoryOrdering
    // call needed to change a row's status given the mocked data above.
    expect(tx.update).toHaveBeenCalledTimes(1);
  });

  test('200 when only child_id changes: previous-category renormalization runs', async () => {
    const tx = makeTxMock();
    // category is unchanged ('Same Category' throughout) — only child_id changes (5 -> 10).
    const updatedRow = { id: 1, childId: 10, classId: 20, category: 'Same Category' };
    tx.select
      .mockReturnValueOnce(makeChain([{ childId: 5, category: 'Same Category' }])) // existence check
      .mockReturnValueOnce(makeChain([{ classId: 20 }])) // classChildren check
      .mockReturnValueOnce(makeChain([{ id: 1, status: 'to be presented' }])) // normalizeCategoryOrdering(new child_id/category) — already desired, no update
      .mockReturnValueOnce(makeChain([])); // normalizeCategoryOrdering(previous child_id/category) — no rows left, no-op
    tx.update.mockReturnValueOnce(makeChain([updatedRow]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, category: 'Same Category', status: 'to be presented' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedRow);
    // 4 selects proves the previous-category renormalization ran even though
    // category itself didn't change — i.e. the child_id-changed disjunct alone
    // is sufficient to trigger it.
    expect(tx.select).toHaveBeenCalledTimes(4);
    expect(tx.update).toHaveBeenCalledTimes(1);
  });

  test('200 when neither child_id nor category changes: no previous-category renormalization', async () => {
    const tx = makeTxMock();
    const updatedRow = { id: 1, childId: 10, classId: 20, category: 'Same Category' };
    tx.select
      .mockReturnValueOnce(makeChain([{ childId: 10, category: 'Same Category' }])) // existence check
      .mockReturnValueOnce(makeChain([{ classId: 20 }])) // classChildren check
      .mockReturnValueOnce(makeChain([{ id: 1, status: 'to be presented' }])); // normalizeCategoryOrdering(current category) — already desired, no update
    tx.update.mockReturnValueOnce(makeChain([updatedRow]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, category: 'Same Category', status: 'to be presented' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedRow);
    // Only 3 selects: the previous-category renormalization must NOT run
    // when neither child_id nor category changed from the stored row.
    expect(tx.select).toHaveBeenCalledTimes(3);
    expect(tx.update).toHaveBeenCalledTimes(1);
  });

  test('500 when the transaction throws an unexpected error', async () => {
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .put('/api/presentations/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(500);
  });
});
