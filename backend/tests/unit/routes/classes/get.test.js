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

const dummyChain = () => makeChain([]);

describe('classes routes: GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/classes');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  describe('GET /api/classes', () => {
    test('admin gets the unfiltered query', async () => {
      const baseChain = makeChain([]);
      dbMock.select.mockReturnValueOnce(baseChain);

      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(baseChain.where).not.toHaveBeenCalled();
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test("teacher's query is filtered to their assigned classes", async () => {
      const baseChain = makeChain([]);
      dbMock.select.mockReturnValueOnce(baseChain).mockReturnValueOnce(dummyChain());

      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(baseChain.where).toHaveBeenCalledTimes(1);
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });

    test('parent gets the child-ownership filtered query', async () => {
      const baseChain = makeChain([]);
      dbMock.select
        .mockReturnValueOnce(baseChain)
        .mockReturnValueOnce(dummyChain())
        .mockReturnValueOnce(dummyChain());

      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(baseChain.where).toHaveBeenCalledTimes(1);
      expect(dbMock.select).toHaveBeenCalledTimes(3);
    });

    test('unrecognized role gets [] with no query executed', async () => {
      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', authHeader({ id: 1, role: 'bogus' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
      expect(dbMock.select).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/classes/:id', () => {
    test('404 when the class row does not exist', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/classes/999')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(404);
    });

    test('403 for a parent with no child in the class', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(dummyChain());

      const res = await request(app)
        .get('/api/classes/5')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });

    test('200 for a parent with a child in the class', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 3 }]))
        .mockReturnValueOnce(dummyChain())
        .mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }]));

      const res = await request(app)
        .get('/api/classes/5')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 5, name: 'Sunflowers' });
    });

    test('200 for a teacher', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }]));

      const res = await request(app)
        .get('/api/classes/5')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 5, name: 'Sunflowers' });
    });

    test('200 for an admin', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }]));

      const res = await request(app)
        .get('/api/classes/5')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 5, name: 'Sunflowers' });
    });
  });

  describe('GET /api/classes/:id/next-presentations', () => {
    test('403 for a parent with no child in the class', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(dummyChain());

      const res = await request(app)
        .get('/api/classes/5/next-presentations')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
    });

    test('200 with the presentation list for a parent with a child in the class', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 3 }]))
        .mockReturnValueOnce(dummyChain())
        .mockReturnValueOnce(makeChain([{ id: 10, name: 'Pouring' }]));

      const res = await request(app)
        .get('/api/classes/5/next-presentations')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 10, name: 'Pouring' }]);
    });

    test('200 with the presentation list for a teacher', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 10, name: 'Pouring' }]));

      const res = await request(app)
        .get('/api/classes/5/next-presentations')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 10, name: 'Pouring' }]);
    });

    test('200 with the presentation list for an admin', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 10, name: 'Pouring' }]));

      const res = await request(app)
        .get('/api/classes/5/next-presentations')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 10, name: 'Pouring' }]);
    });
  });

  describe('GET /api/classes/by-age/:age', () => {
    test('400 for a non-numeric age', async () => {
      const res = await request(app)
        .get('/api/classes/by-age/abc')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a negative age', async () => {
      const res = await request(app)
        .get('/api/classes/by-age/-1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('200 with the matching classes otherwise', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }]));

      const res = await request(app)
        .get('/api/classes/by-age/4')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: 5, name: 'Sunflowers' }]);
    });
  });
});
