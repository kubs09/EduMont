import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { transaction: jest.fn() };

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const makeTxMock = () => ({ update: jest.fn(() => makeChain([])), insert: jest.fn() });

const validPayload = {
  category: 'Practical Life',
  name: 'Pouring Exercise',
  age_group: 'Toddler',
  display_order: 1,
};

describe('POST /api/presentations/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/presentations/categories').send(validPayload);

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 for a non-admin', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send(validPayload);

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when category is missing', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPayload, category: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPayload, name: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when age_group is missing', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPayload, age_group: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when display_order is missing', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPayload, display_order: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when display_order is not a number', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPayload, display_order: 'abc' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when display_order is not positive', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPayload, display_order: 0 });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when category is not a string', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPayload, category: 123 });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when name is not a string', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPayload, name: 123 });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('201 happy path', async () => {
    const tx = makeTxMock();
    const insertedRow = {
      id: 1,
      category: 'Practical Life',
      name: 'Pouring Exercise',
      ageGroup: 'Toddler',
      displayOrder: 1,
      notes: null,
      createdAt: new Date().toISOString(),
    };
    tx.insert.mockReturnValueOnce(makeChain([insertedRow]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(insertedRow);
  });

  test('400 on a 23505 unique-violation from the transaction', async () => {
    const error = new Error('duplicate key value violates unique constraint');
    error.code = '23505';
    dbMock.transaction.mockRejectedValueOnce(error);

    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'A presentation with this category and display order already exists',
    });
  });

  test('500 when the transaction throws an unrelated unexpected error', async () => {
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validPayload);

    expect(res.status).toBe(500);
  });
});
