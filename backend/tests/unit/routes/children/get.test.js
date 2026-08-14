import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), update: jest.fn(), transaction: jest.fn() };

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

describe('children routes: GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/children');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  describe('GET /api/children', () => {
    test('admin gets an unfiltered query', async () => {
      const baseChain = makeChain([]);
      dbMock.select.mockReturnValueOnce(baseChain);

      const res = await request(app)
        .get('/api/children')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(baseChain.where).not.toHaveBeenCalled();
    });

    test('parent gets a filtered query', async () => {
      const baseChain = makeChain([]);
      const subChain = makeChain([]);
      dbMock.select.mockReturnValueOnce(baseChain).mockReturnValueOnce(subChain);

      const res = await request(app)
        .get('/api/children')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(baseChain.where).toHaveBeenCalledTimes(1);
    });

    test('teacher gets a filtered query', async () => {
      const baseChain = makeChain([]);
      const subChain = makeChain([]);
      dbMock.select.mockReturnValueOnce(baseChain).mockReturnValueOnce(subChain);

      const res = await request(app)
        .get('/api/children')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(baseChain.where).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/children/:id', () => {
    test('404 for an unknown id', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/children/999')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(404);
    });

    test('403 when a parent requests a child that is not theirs', async () => {
      dbMock.select.mockReturnValueOnce(
        makeChain([{ id: 5, firstname: 'Kid', surname: 'One', parents: [{ id: 99 }] }])
      );

      const res = await request(app)
        .get('/api/children/5')
        .set('Authorization', authHeader({ id: 1, role: 'parent' }));

      expect(res.status).toBe(403);
    });

    test('200 with child data otherwise', async () => {
      dbMock.select.mockReturnValueOnce(
        makeChain([{ id: 5, firstname: 'Kid', surname: 'One', parents: [{ id: 1 }] }])
      );

      const res = await request(app)
        .get('/api/children/5')
        .set('Authorization', authHeader({ id: 1, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 5, firstname: 'Kid', surname: 'One' });
    });
  });

  describe('GET /api/children/:id/classes', () => {
    test('200 with the class list', async () => {
      dbMock.select.mockReturnValueOnce(
        makeChain([{ id: 3, name: 'Sunflowers', description: null }])
      );

      const res = await request(app)
        .get('/api/children/5/classes')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 3, name: 'Sunflowers', description: null }]);
    });
  });

  describe('GET /api/children/:id/presentations', () => {
    test('404 when the child has no class', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/children/5/presentations')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(404);
    });

    test('403 for an admin without a granted permission', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 3 }]))
        .mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/children/5/presentations')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(403);
    });

    test('403 for a teacher not assigned to the class', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 3 }]))
        .mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/children/5/presentations')
        .set('Authorization', authHeader({ id: 2, role: 'teacher' }));

      expect(res.status).toBe(403);
    });

    test('403 for a parent not linked to the child', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 3 }]))
        .mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/children/5/presentations')
        .set('Authorization', authHeader({ id: 4, role: 'parent' }));

      expect(res.status).toBe(403);
    });

    test('200 for an authorized admin', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 3 }]))
        .mockReturnValueOnce(makeChain([{ id: 1 }]))
        .mockReturnValueOnce(makeChain([{ id: 10, name: 'Pouring', category: 'Practical Life' }]));

      const res = await request(app)
        .get('/api/children/5/presentations')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 10, name: 'Pouring', category: 'Practical Life' }]);
    });

    test('200 for an authorized teacher', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 3 }]))
        .mockReturnValueOnce(makeChain([{ id: 3 }]))
        .mockReturnValueOnce(makeChain([{ id: 10, name: 'Pouring', category: 'Practical Life' }]));

      const res = await request(app)
        .get('/api/children/5/presentations')
        .set('Authorization', authHeader({ id: 2, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 10, name: 'Pouring', category: 'Practical Life' }]);
    });

    test('200 for an authorized parent', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 3 }]))
        .mockReturnValueOnce(makeChain([{ id: 5 }]))
        .mockReturnValueOnce(makeChain([{ id: 10, name: 'Pouring', category: 'Practical Life' }]));

      const res = await request(app)
        .get('/api/children/5/presentations')
        .set('Authorization', authHeader({ id: 4, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 10, name: 'Pouring', category: 'Practical Life' }]);
    });
  });
});
