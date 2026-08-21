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

const validUpdate = { firstname: 'Ada', surname: 'Lovelace' };

const makeTxMock = () => ({
  update: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  delete: jest.fn(),
});

describe('PUT /api/children/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).put('/api/children/1').send(validUpdate);

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for an invalid :id', async () => {
    const res = await request(app)
      .put('/api/children/not-a-number')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for validation errors', async () => {
    const res = await request(app)
      .put('/api/children/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ firstname: 'A', surname: 'Lovelace' });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('non-admin sending parent_ids gets 403', async () => {
    const res = await request(app)
      .put('/api/children/1')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ ...validUpdate, parent_ids: [1] });

    expect(res.status).toBe(403);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('admin sending invalid parent_ids gets 400', async () => {
    const res = await request(app)
      .put('/api/children/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, parent_ids: ['abc'] });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('404 for an unknown child', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/children/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(404);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test("403 when a parent isn't linked to the child", async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }])).mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/children/1')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }))
      .send(validUpdate);

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for an invalid class_id', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));

    const res = await request(app)
      .put('/api/children/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, class_id: -5 });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when the transaction throws selectedClassNotSuitable', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
    const tx = makeTxMock();
    tx.update.mockReturnValueOnce(
      makeChain([{ id: 1, firstname: 'Ada', surname: 'Lovelace', dateOfBirth: '2020-01-01' }])
    );
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/children/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, class_id: 5 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'selectedClassNotSuitable' });
  });

  test('400 when the transaction finds invalid parent ids', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
    const tx = makeTxMock();
    tx.update.mockReturnValueOnce(
      makeChain([{ id: 1, firstname: 'Ada', surname: 'Lovelace', dateOfBirth: '2020-01-01' }])
    );
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/children/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, parent_ids: [42] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errors: ['One or more parent IDs are invalid'] });
  });

  test('200 with the updated child on success', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
    const tx = makeTxMock();
    const finalChild = { id: 1, firstname: 'Ada', surname: 'Lovelace', classId: null, parents: [] };
    tx.update.mockReturnValueOnce(
      makeChain([{ id: 1, firstname: 'Ada', surname: 'Lovelace', dateOfBirth: '2020-01-01' }])
    );
    tx.select.mockReturnValueOnce(makeChain([finalChild]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/children/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(finalChild);
  });
});
