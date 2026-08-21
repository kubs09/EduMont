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

const validExcuse = {
  date_from: '2026-01-10',
  date_to: '2026-01-12',
  reason: 'Sick leave',
};

describe('children routes: excuses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/children/1/excuses');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  describe('GET /api/children/:id/excuses', () => {
    test('400 for a non-integer child id', async () => {
      const res = await request(app)
        .get('/api/children/not-a-number/excuses')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a parent not linked to the child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test("403 for a teacher not assigned to the child's class", async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('200 for admin, returning the joined excuse list', async () => {
      const excuses = [
        {
          id: 1,
          child_id: 1,
          parent_id: 7,
          date_from: '2026-01-10',
          date_to: '2026-01-12',
          reason: 'Sick leave',
          created_at: '2026-01-01T00:00:00.000Z',
          parent_firstname: 'Ada',
          parent_surname: 'Lovelace',
        },
      ];
      dbMock.select.mockReturnValueOnce(makeChain(excuses));

      const res = await request(app)
        .get('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(excuses);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('200 for a linked parent, returning the joined excuse list', async () => {
      const excuses = [{ id: 2, child_id: 1, parent_id: 7, reason: 'Doctor visit' }];
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 1 }]))
        .mockReturnValueOnce(makeChain(excuses));

      const res = await request(app)
        .get('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(excuses);
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });

    test('200 for an assigned teacher, returning the joined excuse list', async () => {
      const excuses = [{ id: 3, child_id: 1, parent_id: 7, reason: 'Family trip' }];
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 3 }]))
        .mockReturnValueOnce(makeChain(excuses));

      const res = await request(app)
        .get('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(excuses);
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /api/children/:id/excuses', () => {
    test('403 for a non-parent role (admin)', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validExcuse);

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
      expect(dbMock.insert).not.toHaveBeenCalled();
    });

    test('403 for a non-parent role (teacher)', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
        .send(validExcuse);

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
      expect(dbMock.insert).not.toHaveBeenCalled();
    });

    test('400 for a non-integer child id', async () => {
      const res = await request(app)
        .post('/api/children/not-a-number/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
      expect(dbMock.insert).not.toHaveBeenCalled();
    });

    test('400 for missing date_from', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_from: undefined });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a malformed date_from', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_from: '01-10-2026' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for missing date_to', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_to: undefined });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a malformed date_to', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_to: '2026/01/12' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 when date_to is before date_from', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_from: '2026-01-12', date_to: '2026-01-10' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for missing reason', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, reason: undefined });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a reason over 1000 characters', async () => {
      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, reason: 'a'.repeat(1001) });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a parent not linked to the child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(403);
      expect(dbMock.insert).not.toHaveBeenCalled();
    });

    test('201 with the created excuse on success', async () => {
      const createdExcuse = {
        id: 1,
        childId: 1,
        parentId: 7,
        dateFrom: '2026-01-10',
        dateTo: '2026-01-12',
        reason: 'Sick leave',
      };
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
      dbMock.insert.mockReturnValueOnce(makeChain([createdExcuse]));

      const res = await request(app)
        .post('/api/children/1/excuses')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdExcuse);
    });
  });

  describe('PUT /api/children/:id/excuses/:excuseId', () => {
    test('403 for a non-parent role', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validExcuse);

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    test('400 for a non-integer child id', async () => {
      const res = await request(app)
        .put('/api/children/not-a-number/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a non-integer excuse id', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/not-a-number')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for missing date_from', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_from: undefined });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a malformed date_from', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_from: '01-10-2026' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for missing date_to', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_to: undefined });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a malformed date_to', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_to: '2026/01/12' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 when date_to is before date_from', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, date_from: '2026-01-12', date_to: '2026-01-10' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for missing reason', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, reason: undefined });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a reason over 1000 characters', async () => {
      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send({ ...validExcuse, reason: 'a'.repeat(1001) });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a parent not linked to the child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(403);
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    test('404 for an unknown excuse', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
      dbMock.update.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .put('/api/children/1/excuses/999')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(404);
    });

    test('404 for an excuse belonging to a different child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
      dbMock.update.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .put('/api/children/2/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(404);
    });

    test("404 for another parent's excuse", async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
      dbMock.update.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 8, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(404);
    });

    test('200 with the updated excuse on success', async () => {
      const updatedExcuse = {
        id: 1,
        childId: 1,
        parentId: 7,
        dateFrom: '2026-01-10',
        dateTo: '2026-01-12',
        reason: 'Sick leave',
      };
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
      dbMock.update.mockReturnValueOnce(makeChain([updatedExcuse]));

      const res = await request(app)
        .put('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validExcuse);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedExcuse);
    });
  });

  describe('DELETE /api/children/:id/excuses/:excuseId', () => {
    test('400 for a non-integer child id', async () => {
      const res = await request(app)
        .delete('/api/children/not-a-number/excuses/1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a non-integer excuse id', async () => {
      const res = await request(app)
        .delete('/api/children/1/excuses/not-a-number')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a role that is neither parent nor admin', async () => {
      const res = await request(app)
        .delete('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('404 for an unknown excuse id', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/1/excuses/999')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(404);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });

    test("400 when the excuse's child_id doesn't match the URL's child id", async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1, child_id: 2, parent_id: 7 }]));

      const res = await request(app)
        .delete('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });

    test('parent: 403 when not linked to the child', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 1, child_id: 1, parent_id: 7 }]))
        .mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });

    test('parent: 403 when the excuse belongs to another parent', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 1, child_id: 1, parent_id: 8 }]))
        .mockReturnValueOnce(makeChain([{ id: 1 }]));

      const res = await request(app)
        .delete('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });

    test('200 on success for the owning parent', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 1, child_id: 1, parent_id: 7 }]))
        .mockReturnValueOnce(makeChain([{ id: 1 }]));
      dbMock.delete.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Excuse cancelled' });
    });

    test('200 on success for admin (any excuse)', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1, child_id: 1, parent_id: 7 }]));
      dbMock.delete.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .delete('/api/children/1/excuses/1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Excuse cancelled' });
    });
  });
});
