import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';
import { createSupabaseMock } from '../../../helpers/supabaseMock.js';

const dbMock = { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };
const supabaseMock = createSupabaseMock();

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

jest.unstable_mockModule('#backend/config/supabase.js', () => ({
  __esModule: true,
  default: supabaseMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const documentRow = (overrides = {}) => ({
  id: 1,
  title: 'Fixture Document',
  description: null,
  file_url: 'https://storage.example.com/documents/fixture.pdf',
  file_name: 'fixture.pdf',
  mime_type: 'application/pdf',
  size_bytes: 1024,
  class_id: null,
  child_id: 5,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  class_name: null,
  child_firstname: 'Ada',
  child_surname: 'Lovelace',
  created_by_firstname: 'Grace',
  created_by_surname: 'Hopper',
  updated_by_firstname: 'Grace',
  updated_by_surname: 'Hopper',
  ...overrides,
});

describe('documents routes: get', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/documents');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  describe('GET /api/documents', () => {
    test('403 for a parent with neither class_id nor child_id', async () => {
      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a non-numeric class_id', async () => {
      const res = await request(app)
        .get('/api/documents?class_id=abc')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a non-numeric child_id', async () => {
      const res = await request(app)
        .get('/api/documents?child_id=abc')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a non-numeric created_by', async () => {
      const res = await request(app)
        .get('/api/documents?created_by=abc')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a teacher not linked to the requested class_id', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/documents?class_id=3')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('403 for a parent not linked to the requested child_id', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/documents?child_id=5')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('200 for admin, returning everything unfiltered', async () => {
      const rows = [documentRow(), documentRow({ id: 2 })];
      dbMock.select.mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('created_by filters results without itself gating access', async () => {
      const rows = [documentRow({ id: 3 })];
      dbMock.select.mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/documents?created_by=1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/documents/child/:childId', () => {
    test("403 when the caller isn't linked to the child", async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/documents/child/5')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('200 with results for a linked parent', async () => {
      const rows = [documentRow()];
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 1 }]))
        .mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/documents/child/5')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
    });
  });

  describe('GET /api/documents/class/:classId', () => {
    test("403 when the caller isn't linked to the class", async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/documents/class/3')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('200 with results for a linked teacher', async () => {
      const rows = [documentRow({ id: 4, class_id: 3, child_id: null })];
      dbMock.select
        .mockReturnValueOnce(makeChain([{ id: 3 }]))
        .mockReturnValueOnce(makeChain(rows));

      const res = await request(app)
        .get('/api/documents/class/3')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
    });
  });

  describe('GET /api/documents/:id', () => {
    test("404 when the document doesn't exist", async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/documents/999')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(404);
    });

    test("403 when the caller isn't linked to the document's child/class", async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([documentRow()]))
        .mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/documents/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
    });

    test('200 for a linked parent', async () => {
      const row = documentRow();
      dbMock.select
        .mockReturnValueOnce(makeChain([row]))
        .mockReturnValueOnce(makeChain([{ id: 1 }]));

      const res = await request(app)
        .get('/api/documents/1')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(row);
    });

    test('200 for a linked teacher', async () => {
      const row = documentRow();
      dbMock.select
        .mockReturnValueOnce(makeChain([row]))
        .mockReturnValueOnce(makeChain([{ id: 1 }]));

      const res = await request(app)
        .get('/api/documents/1')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(row);
    });

    test('200 for admin', async () => {
      const row = documentRow();
      dbMock.select.mockReturnValueOnce(makeChain([row]));

      const res = await request(app)
        .get('/api/documents/1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(row);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });
  });
});
