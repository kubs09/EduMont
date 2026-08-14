import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), selectDistinct: jest.fn() };

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('GET /api/presentations/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /categories', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/presentations/categories');

      expect(res.status).toBe(401);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a non-admin', async () => {
      const res = await request(app)
        .get('/api/presentations/categories')
        .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('200 returning db.select results verbatim', async () => {
      const rows = [
        {
          id: 1,
          category: 'Practical Life',
          name: 'Pouring',
          age_group: 'Toddler',
          display_order: 1,
          notes: null,
          created_at: null,
        },
      ];
      dbMock.select.mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/presentations/categories')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
    });
  });

  describe('GET /categories/category/:category', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/presentations/categories/category/Practical Life');

      expect(res.status).toBe(401);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a non-admin', async () => {
      const res = await request(app)
        .get('/api/presentations/categories/category/Practical Life')
        .set('Authorization', authHeader({ id: 1, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('200 returning db.select results verbatim', async () => {
      const rows = [
        {
          id: 2,
          category: 'Practical Life',
          name: 'Sweeping',
          age_group: 'Toddler',
          display_order: 2,
          notes: null,
          created_at: null,
        },
      ];
      dbMock.select.mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/presentations/categories/category/Practical Life')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
    });
  });

  describe('GET /categories/list/categories', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/presentations/categories/list/categories');

      expect(res.status).toBe(401);
      expect(dbMock.selectDistinct).not.toHaveBeenCalled();
    });

    test('403 for a non-admin', async () => {
      const res = await request(app)
        .get('/api/presentations/categories/list/categories')
        .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

      expect(res.status).toBe(403);
      expect(dbMock.selectDistinct).not.toHaveBeenCalled();
    });

    test('200 returning distinct category names', async () => {
      dbMock.selectDistinct.mockReturnValueOnce(
        makeChain([{ category: 'Practical Life' }, { category: 'Sensorial' }])
      );

      const res = await request(app)
        .get('/api/presentations/categories/list/categories')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(['Practical Life', 'Sensorial']);
    });
  });
});
