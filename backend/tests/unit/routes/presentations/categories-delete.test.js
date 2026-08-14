import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), transaction: jest.fn() };

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const makeTxMock = () => ({
  delete: jest.fn(() => makeChain([])),
  update: jest.fn(() => makeChain([])),
});

const existingRow = (overrides = {}) => ({
  id: 1,
  category: 'Practical Life',
  ageGroup: 'Toddler',
  displayOrder: 2,
  ...overrides,
});

describe('DELETE /api/presentations/categories/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/presentations/categories/1');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('403 for a non-admin', async () => {
    const res = await request(app)
      .delete('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

    expect(res.status).toBe(403);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a non-numeric id, without ever opening a transaction', async () => {
    const res = await request(app)
      .delete('/api/presentations/categories/abc')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid presentation ID' });
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('404 when the category presentation does not exist', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .delete('/api/presentations/categories/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Category presentation not found' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('200 happy path', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));
    const tx = makeTxMock();
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Category presentation deleted successfully' });
    expect(tx.delete).toHaveBeenCalledTimes(1);
    // Gap-closing shift: one negative-convert, one positive-convert-back.
    expect(tx.update).toHaveBeenCalledTimes(2);
  });

  test('500 when the transaction throws an unexpected error', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .delete('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(500);
  });
});
