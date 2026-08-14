import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), transaction: jest.fn() };

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

const makeTxMock = () => ({ select: jest.fn(), insert: jest.fn(), update: jest.fn() });

const validPresentation = { child_id: 10, class_id: 20, name: 'Pouring Exercise' };

describe('POST /api/presentations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/presentations').send(validPresentation);

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when child_id is missing', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, child_id: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when child_id is not an integer', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, child_id: 'abc' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when class_id is missing', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, class_id: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when class_id is not an integer', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, class_id: 'abc' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, name: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when status is invalid', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, status: 'not-a-status' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when name exceeds 200 characters', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, name: 'a'.repeat(201) });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when category exceeds 100 characters', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, category: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when notes exceeds 1000 characters', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, notes: 'a'.repeat(1001) });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test("403 when the caller can't edit the child's presentations", async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 7, role: 'teacher' }))
      .send(validPresentation);

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when the child is not assigned to the class', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validPresentation);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  test('201 happy path', async () => {
    const tx = makeTxMock();
    const insertedPresentation = {
      id: 55,
      childId: 10,
      classId: 20,
      name: 'Pouring Exercise',
      category: null,
      displayOrder: 0,
      status: 'prerequisites not met',
      notes: null,
      createdBy: 1,
      updatedBy: 1,
    };
    tx.select.mockReturnValueOnce(makeChain([{ classId: 20 }]));
    tx.insert.mockReturnValueOnce(makeChain([insertedPresentation]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validPresentation);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(insertedPresentation);
    // category was omitted, so normalizeCategoryOrdering no-ops: only the
    // classChildren check should have hit tx.select.
    expect(tx.select).toHaveBeenCalledTimes(1);
  });

  test('defaults display_order from the matching category_presentations row when omitted', async () => {
    const tx = makeTxMock();
    const insertedPresentation = {
      id: 56,
      childId: 10,
      classId: 20,
      name: 'Pouring Exercise',
      category: 'Practical Life',
      displayOrder: 4,
      status: 'prerequisites not met',
      notes: null,
      createdBy: 1,
      updatedBy: 1,
    };
    tx.select
      .mockReturnValueOnce(makeChain([{ classId: 20 }])) // classChildren check
      .mockReturnValueOnce(makeChain([{ ageGroup: 'Toddler' }])) // classes.ageGroup lookup
      .mockReturnValueOnce(makeChain([{ displayOrder: 4 }])) // category_presentations lookup
      .mockReturnValueOnce(makeChain([{ id: 56, status: 'to be presented' }])); // normalizeCategoryOrdering's own select — already the desired state, so no update follows
    tx.insert.mockReturnValueOnce(makeChain([insertedPresentation]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validPresentation, category: 'Practical Life' });

    expect(res.status).toBe(201);
    expect(res.body.displayOrder).toBe(4);
    expect(tx.select).toHaveBeenCalledTimes(4);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test('500 when the transaction throws an unexpected error', async () => {
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validPresentation);

    expect(res.status).toBe(500);
  });
});
