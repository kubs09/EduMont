import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };

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

describe('classes routes: history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/classes/1/history');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  describe('GET /api/classes/:id/history', () => {
    test('200 for admin, with no ownership check', async () => {
      const rows = [{ id: 1, class_id: 1, date: '2026-01-10', notes: 'Note' }];
      dbMock.select.mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/classes/1/history')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('200 for teacher, with no ownership check', async () => {
      const rows = [{ id: 1, class_id: 1, date: '2026-01-10', notes: 'Note' }];
      dbMock.select.mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/classes/1/history')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('403 for a parent with no child in the class', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/classes/1/history')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('200 for a parent with a child in the class', async () => {
      const rows = [{ id: 1, class_id: 1, date: '2026-01-10', notes: 'Note' }];
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }])).mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/classes/1/history')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });

    test('403 for an unrecognized role', async () => {
      const res = await request(app)
        .get('/api/classes/1/history')
        .set('Authorization', authHeader({ id: 1, role: 'bogus' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/classes/:id/history', () => {
    test('403 for parent', async () => {
      const res = await request(app)
        .post('/api/classes/1/history')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ date: '2026-01-10', notes: 'Note' });

      expect(res.status).toBe(403);
      expect(dbMock.insert).not.toHaveBeenCalled();
    });

    test('201 on success for admin', async () => {
      const created = { id: 1, classId: 1, date: '2026-01-10', notes: 'Note', createdBy: 1 };
      dbMock.insert.mockReturnValueOnce(makeChain([created]));

      const res = await request(app)
        .post('/api/classes/1/history')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ date: '2026-01-10', notes: 'Note' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
    });

    test('201 on success for teacher', async () => {
      const created = { id: 2, classId: 1, date: '2026-01-10', notes: 'Note', createdBy: 9 };
      dbMock.insert.mockReturnValueOnce(makeChain([created]));

      const res = await request(app)
        .post('/api/classes/1/history')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
        .send({ date: '2026-01-10', notes: 'Note' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
    });
  });

  describe('DELETE /api/classes/:classId/history/:historyId', () => {
    test('403 for parent', async () => {
      const res = await request(app)
        .delete('/api/classes/1/history/5')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });

    test('200 on success for admin', async () => {
      dbMock.delete.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/classes/1/history/5')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'History entry deleted successfully' });
    });

    test('200 for a non-existent history id, since the route has no existence check', async () => {
      dbMock.delete.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/classes/1/history/999999999')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'History entry deleted successfully' });
    });
  });
});
