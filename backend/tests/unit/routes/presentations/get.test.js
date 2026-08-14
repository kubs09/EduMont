import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn() };

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

describe('GET /api/presentations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/presentations/', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/presentations');

      expect(res.status).toBe(401);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a parent', async () => {
      const res = await request(app)
        .get('/api/presentations')
        .set('Authorization', authHeader({ id: 1, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for an invalid status filter', async () => {
      const res = await request(app)
        .get('/api/presentations')
        .query({ status: 'not-a-status' })
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('200 unfiltered for admin', async () => {
      const mainChain = makeChain([{ id: 1, name: 'Pouring' }]);
      dbMock.select.mockReturnValueOnce(mainChain);

      const res = await request(app)
        .get('/api/presentations')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: 'Pouring' }]);
      expect(mainChain.where).not.toHaveBeenCalled();
    });

    test('200 filtered by status for admin', async () => {
      const mainChain = makeChain([{ id: 1, name: 'Pouring', status: 'mastered' }]);
      dbMock.select.mockReturnValueOnce(mainChain);

      const res = await request(app)
        .get('/api/presentations')
        .query({ status: 'mastered' })
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(mainChain.where).toHaveBeenCalledTimes(1);
    });

    test("200 for a teacher, scoped to their classes via an exists subquery", async () => {
      const subChain = makeChain([]);
      const mainChain = makeChain([{ id: 2, name: 'Sorting' }]);
      dbMock.select.mockReturnValueOnce(subChain).mockReturnValueOnce(mainChain);

      const res = await request(app)
        .get('/api/presentations')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 2, name: 'Sorting' }]);
      expect(mainChain.where).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/presentations/child/:childId', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/presentations/child/5');

      expect(res.status).toBe(401);
    });

    test('400 for an invalid childId', async () => {
      const res = await request(app)
        .get('/api/presentations/child/not-a-number')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 when the teacher does not teach a class the child is in', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/presentations/child/5')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(403);
    });

    test('200 without a status filter (admin)', async () => {
      const mainChain = makeChain([{ id: 1, name: 'Pouring' }]);
      dbMock.select.mockReturnValueOnce(mainChain);

      const res = await request(app)
        .get('/api/presentations/child/5')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: 'Pouring' }]);
    });

    test('200 with a status filter (admin)', async () => {
      const mainChain = makeChain([{ id: 1, name: 'Pouring', status: 'mastered' }]);
      dbMock.select.mockReturnValueOnce(mainChain);

      const res = await request(app)
        .get('/api/presentations/child/5')
        .query({ status: 'mastered' })
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(mainChain.where).toHaveBeenCalledTimes(1);
    });

    test('200 for a teacher who teaches a class the child is in', async () => {
      const mainChain = makeChain([{ id: 2, name: 'Sorting' }]);
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 1 }])) // canAccessChildpresentation check, non-empty
        .mockReturnValueOnce(mainChain);

      const res = await request(app)
        .get('/api/presentations/child/5')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 2, name: 'Sorting' }]);
    });

    test('403 for a parent', async () => {
      const res = await request(app)
        .get('/api/presentations/child/5')
        .set('Authorization', authHeader({ id: 4, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/presentations/class/:classId', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/presentations/class/5');

      expect(res.status).toBe(401);
    });

    test('400 for an invalid classId', async () => {
      const res = await request(app)
        .get('/api/presentations/class/not-a-number')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a teacher not teaching the class', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/presentations/class/5')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(403);
    });

    test('403 for a parent with no child in the class', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([])) // outer parentChildResult query
        .mockReturnValueOnce(makeChain([])); // exists() subquery built while constructing the where clause
      const res = await request(app)
        .get('/api/presentations/class/5')
        .set('Authorization', authHeader({ id: 4, role: 'parent' }));

      expect(res.status).toBe(403);
    });

    test('200 for an admin', async () => {
      const mainChain = makeChain([{ id: 1, name: 'Pouring' }]);
      dbMock.select.mockReturnValueOnce(mainChain);

      const res = await request(app)
        .get('/api/presentations/class/5')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 1, name: 'Pouring' }]);
    });

    test('200 for a teacher who teaches the class', async () => {
      const mainChain = makeChain([{ id: 2, name: 'Sorting' }]);
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 5 }])) // teacherClassResult, non-empty
        .mockReturnValueOnce(mainChain);

      const res = await request(app)
        .get('/api/presentations/class/5')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 2, name: 'Sorting' }]);
    });

    test('200 for a parent with a child in the class, scoped to their own children', async () => {
      const mainChain = makeChain([{ id: 3, name: 'Scooping' }]);
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 5 }])) // outer parentChildResult query, non-empty
        .mockReturnValueOnce(makeChain([])) // exists() subquery inside that access check's where clause
        .mockReturnValueOnce(makeChain([])) // exists() subquery added to the results-query conditions for parents
        .mockReturnValueOnce(mainChain); // the results query itself

      const res = await request(app)
        .get('/api/presentations/class/5')
        .set('Authorization', authHeader({ id: 4, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 3, name: 'Scooping' }]);
    });
  });
});
