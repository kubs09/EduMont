import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), update: jest.fn(), delete: jest.fn(), transaction: jest.fn() };

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

const makeTxMock = () => ({ delete: jest.fn() });

describe('children routes: DELETE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/children/1');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  describe('DELETE /api/children/:id', () => {
    test('404 for an unknown child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/999')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(404);
      expect(dbMock.transaction).not.toHaveBeenCalled();
    });

    test("403 when a parent isn't linked", async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 1 }]))
        .mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.transaction).not.toHaveBeenCalled();
    });

    test('200 on success', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
      const tx = makeTxMock();
      tx.delete.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(makeChain([]));
      dbMock.transaction.mockImplementation((cb) => cb(tx));

      const res = await request(app)
        .delete('/api/children/1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Child deleted successfully' });
      expect(tx.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE /api/children/:childId/classes/:classId', () => {
    test('400 for invalid ids', async () => {
      const res = await request(app)
        .delete('/api/children/not-a-number/classes/2')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('404 for an unknown child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/999/classes/2')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(404);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });

    test("403 when a parent isn't linked", async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 1 }]))
        .mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/1/classes/2')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });

    test('200 on success', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
      dbMock.delete.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/1/classes/2')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Child removed from class successfully' });
    });
  });
});
