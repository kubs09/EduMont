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

// Captures every tx.update({...}).set(setArg).where(whereArg) call, in order,
// instead of ignoring arguments like makeChain does — lets tests prove the
// shift dance actually ran the right number of times with the right final
// field values.
const makeCapturingTx = () => {
  const setCalls = [];
  const update = jest.fn(() => ({
    set: jest.fn((setArg) => {
      setCalls.push(setArg);
      return { where: jest.fn(() => Promise.resolve([])) };
    }),
  }));
  return { tx: { select: jest.fn(), update }, setCalls };
};

const existingRow = (overrides = {}) => ({
  id: 1,
  category: 'Practical Life',
  ageGroup: 'Toddler',
  displayOrder: 3,
  ...overrides,
});

describe('PUT /api/presentations/categories/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .put('/api/presentations/categories/1')
      .send({ name: 'New Name' });

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('403 for a non-admin', async () => {
    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ name: 'New Name' });

    expect(res.status).toBe(403);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a non-numeric id, without ever opening a transaction', async () => {
    const res = await request(app)
      .put('/api/presentations/categories/abc')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ name: 'New Name' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid presentation ID' });
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('404 when the category presentation does not exist', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/presentations/categories/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ name: 'New Name' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Category presentation not found' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when category is not a string', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ category: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Category must be a string' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when age_group is not a string', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ age_group: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Age group must be a string' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when name is not a string', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ name: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Name must be a string' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when display_order is not a positive number', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ display_order: 0 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Display order must be a positive number' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('200 field-only update: no reordering triggered', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));
    const { tx, setCalls } = makeCapturingTx();
    const updatedRow = {
      id: 1,
      category: 'Practical Life',
      name: 'New Name',
      age_group: 'Toddler',
      display_order: 3,
      notes: null,
      created_at: null,
    };
    tx.select.mockReturnValueOnce(makeChain([updatedRow]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedRow);
    // Only the field-update call, no shift dance.
    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(setCalls[0]).toEqual({ name: 'New Name' });
  });

  test('200 same-bucket reorder moving up (newOrder > oldOrder)', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow({ displayOrder: 2 })]));
    const { tx, setCalls } = makeCapturingTx();
    const updatedRow = {
      id: 1,
      category: 'Practical Life',
      name: 'Pouring',
      age_group: 'Toddler',
      display_order: 4,
      notes: null,
      created_at: null,
    };
    tx.select.mockReturnValueOnce(makeChain([updatedRow]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ display_order: 4 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedRow);
    // Sentinel park + shift-down + convert-back + final field update.
    expect(tx.update).toHaveBeenCalledTimes(4);
    expect(setCalls[0]).toEqual({ displayOrder: -999999 });
    expect(setCalls[3]).toEqual({ displayOrder: 4 });
  });

  test('200 same-bucket reorder moving down (newOrder < oldOrder)', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow({ displayOrder: 4 })]));
    const { tx, setCalls } = makeCapturingTx();
    const updatedRow = {
      id: 1,
      category: 'Practical Life',
      name: 'Pouring',
      age_group: 'Toddler',
      display_order: 2,
      notes: null,
      created_at: null,
    };
    tx.select.mockReturnValueOnce(makeChain([updatedRow]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ display_order: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedRow);
    expect(tx.update).toHaveBeenCalledTimes(4);
    expect(setCalls[0]).toEqual({ displayOrder: -999999 });
    expect(setCalls[3]).toEqual({ displayOrder: 2 });
  });

  test('200 cross-bucket move (different category)', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([existingRow({ category: 'Practical Life', displayOrder: 2 })])
    );
    const { tx, setCalls } = makeCapturingTx();
    const updatedRow = {
      id: 1,
      category: 'Sensorial',
      name: 'Pouring',
      age_group: 'Toddler',
      display_order: 1,
      notes: null,
      created_at: null,
    };
    tx.select.mockReturnValueOnce(makeChain([updatedRow]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ category: 'Sensorial', display_order: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedRow);
    // Sentinel park, old-bucket shift + convert, new-bucket shift + convert, final field update.
    expect(tx.update).toHaveBeenCalledTimes(6);
    expect(setCalls[0]).toEqual({ displayOrder: -999999 });
    expect(setCalls[5]).toEqual({ category: 'Sensorial', displayOrder: 1 });
  });

  test('400 on a 23505 unique-violation from the transaction', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));
    const error = new Error('duplicate key value violates unique constraint');
    error.code = '23505';
    dbMock.transaction.mockRejectedValueOnce(error);

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ display_order: 5 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'A presentation with this category and display order already exists',
    });
  });

  test('500 when the transaction throws an unrelated unexpected error', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([existingRow()]));
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .put('/api/presentations/categories/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ name: 'New Name' });

    expect(res.status).toBe(500);
  });
});
