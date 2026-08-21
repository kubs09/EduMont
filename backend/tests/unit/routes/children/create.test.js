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

const validChild = {
  firstname: 'Ada',
  surname: 'Lovelace',
  date_of_birth: '2020-01-01',
  parent_ids: [1],
};

const makeTxMock = () => ({ insert: jest.fn(), select: jest.fn() });

describe('POST /api/children', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/children').send(validChild);

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when firstname is too short', async () => {
    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validChild, firstname: 'A' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a bad date format', async () => {
    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validChild, date_of_birth: '01-01-2020' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for an out-of-range age', async () => {
    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validChild, date_of_birth: '1990-01-01' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test("a parent's parent_ids is forced to [self]", async () => {
    const tx = makeTxMock();
    const childParentsChain = makeChain([]);
    tx.insert
      .mockReturnValueOnce(makeChain([{ id: 10 }]))
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(childParentsChain);
    tx.select
      .mockReturnValueOnce(makeChain([{ id: 3 }]))
      .mockReturnValueOnce(makeChain([{ id: 7 }]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }))
      .send({ firstname: 'Ada', surname: 'Lovelace', date_of_birth: '2020-01-01' });

    expect(res.status).toBe(201);
    expect(childParentsChain.values).toHaveBeenCalledWith([{ childId: 10, parentId: 7 }]);
  });

  test("parent submitting another parent's id gets 403", async () => {
    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }))
      .send({ ...validChild, parent_ids: [999] });

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('invalid parent_ids (non-array) returns 400', async () => {
    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validChild, parent_ids: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('invalid parent_ids (non-numeric) returns 400', async () => {
    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validChild, parent_ids: ['abc'] });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 selectedClassNotSuitable when explicit class_id does not fit', async () => {
    const tx = makeTxMock();
    tx.insert.mockReturnValueOnce(makeChain([{ id: 10 }]));
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validChild, class_id: 5 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'selectedClassNotSuitable' });
  });

  test('400 noSuitableClass when no class fits the age', async () => {
    const tx = makeTxMock();
    tx.insert.mockReturnValueOnce(makeChain([{ id: 10 }]));
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validChild);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'noSuitableClass' });
  });

  test('400 invalidParentIds when a parent id does not resolve to a parent user', async () => {
    const tx = makeTxMock();
    tx.insert.mockReturnValueOnce(makeChain([{ id: 10 }])).mockReturnValueOnce(makeChain([]));
    tx.select.mockReturnValueOnce(makeChain([{ id: 3 }])).mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validChild);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errors: ['One or more parent IDs are invalid'] });
  });

  test('201 with the created child on success', async () => {
    const tx = makeTxMock();
    const createdChild = { id: 10, firstname: 'Ada', surname: 'Lovelace' };
    tx.insert
      .mockReturnValueOnce(makeChain([createdChild]))
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]));
    tx.select
      .mockReturnValueOnce(makeChain([{ id: 3 }]))
      .mockReturnValueOnce(makeChain([{ id: 1 }]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validChild);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(createdChild);
  });
});
