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
const { classChildren } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const makeCreateTxMock = () => ({ insert: jest.fn(), select: jest.fn() });
const makeAutoAssignTxMock = () => ({ delete: jest.fn(), select: jest.fn(), insert: jest.fn() });

const validClass = {
  name: 'Sunflowers',
  description: 'A class',
  age_group: 'Toddler',
  min_age: 2,
  max_age: 6,
  teacherId: 5,
};

const dateOfBirthForAge = (age) => {
  const now = new Date();
  return `${now.getFullYear() - age}-01-01`;
};

describe('POST /api/classes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/classes').send(validClass);

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 for a parent', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send(validClass);

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 for a teacher', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send(validClass);

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when teacherId is missing', async () => {
    const tx = makeCreateTxMock();
    tx.insert.mockReturnValueOnce(makeChain([{ id: 10 }]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validClass, teacherId: undefined });

    expect(res.status).toBe(400);
    expect(tx.select).not.toHaveBeenCalled();
  });

  test('400 when assistantId equals teacherId', async () => {
    const tx = makeCreateTxMock();
    tx.insert.mockReturnValueOnce(makeChain([{ id: 10 }]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validClass, assistantId: validClass.teacherId });

    expect(res.status).toBe(400);
    expect(tx.select).not.toHaveBeenCalled();
  });

  test('400 when the chosen teacher is already assigned to another class', async () => {
    const tx = makeCreateTxMock();
    tx.insert.mockReturnValueOnce(makeChain([{ id: 10 }]));
    tx.select.mockReturnValueOnce(makeChain([{ classId: 3 }]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validClass);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('teacher is already assigned'),
    });
  });

  test('400 when the chosen assistant is already assigned to another class', async () => {
    const tx = makeCreateTxMock();
    tx.insert.mockReturnValueOnce(makeChain([{ id: 10 }]));
    tx.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(makeChain([{ classId: 3 }]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validClass, assistantId: 8 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('assistant is already assigned'),
    });
  });

  test('201 on success without an assistant', async () => {
    const tx = makeCreateTxMock();
    tx.insert.mockReturnValueOnce(makeChain([{ id: 10 }])).mockReturnValueOnce(makeChain([]));
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validClass);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 10 });
    expect(tx.insert).toHaveBeenCalledTimes(2);
  });

  test('201 on success with an assistant', async () => {
    const tx = makeCreateTxMock();
    tx.insert
      .mockReturnValueOnce(makeChain([{ id: 10 }]))
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]));
    tx.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validClass, assistantId: 8 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 10 });
    expect(tx.insert).toHaveBeenCalledTimes(3);
  });
});

describe('POST /api/classes/auto-assign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/classes/auto-assign')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('deletes all classChildren rows, re-assigns children whose age fits a class range, leaves the rest unassigned', async () => {
    const tx = makeAutoAssignTxMock();
    const deleteChain = makeChain([]);
    const insertChain = makeChain([]);
    tx.delete.mockReturnValueOnce(deleteChain);
    tx.select
      .mockReturnValueOnce(
        makeChain([
          { id: 1, dateOfBirth: dateOfBirthForAge(4) },
          { id: 2, dateOfBirth: dateOfBirthForAge(15) },
        ])
      )
      .mockReturnValueOnce(makeChain([{ id: 100, minAge: 2, maxAge: 6 }]));
    tx.insert.mockReturnValueOnce(insertChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/classes/auto-assign')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(tx.delete).toHaveBeenCalledWith(classChildren);
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledWith(classChildren);
    expect(insertChain.values).toHaveBeenCalledWith({ classId: 100, childId: 1 });
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledWith({
      target: [classChildren.classId, classChildren.childId],
      set: { createdAt: expect.any(Date) },
    });
  });
});
