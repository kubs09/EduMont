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

const makeTxMock = () => ({
  update: jest.fn(),
  select: jest.fn(),
  delete: jest.fn(),
  insert: jest.fn(),
});

const validBody = {
  name: 'Sunflowers',
  description: 'A class',
  teacherId: 5,
  min_age: 2,
  max_age: 6,
};

describe('PUT /api/classes/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).put('/api/classes/1').send(validBody);

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 for non-admin', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send(validBody);

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-integer/non-positive :id', async () => {
    const res = await request(app)
      .put('/api/classes/0')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a missing name', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, name: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a blank name', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, name: '   ' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a missing teacherId', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, teacherId: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-integer teacherId', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, teacherId: 'abc' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-integer assistantId', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, assistantId: 'xyz' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 when assistantId equals teacherId', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, assistantId: validBody.teacherId });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for an invalid age range (max_age < min_age)', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, min_age: 6, max_age: 2 });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-numeric age range', async () => {
    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, min_age: 'abc' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test("404 when the update's where matches no row", async () => {
    const tx = makeTxMock();
    tx.update.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/classes/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(404);
  });

  test('400 when the new teacher is already assigned to a different class', async () => {
    const tx = makeTxMock();
    tx.update.mockReturnValueOnce(makeChain([{ id: 1 }]));
    tx.select.mockReturnValueOnce(makeChain([{ classId: 3 }]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('teacher is already assigned'),
    });
  });

  test('400 when the new assistant is already assigned to a different class', async () => {
    const tx = makeTxMock();
    tx.update.mockReturnValueOnce(makeChain([{ id: 1 }]));
    tx.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(makeChain([{ classId: 3 }]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, assistantId: 8 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('assistant is already assigned'),
    });
  });

  test('200 sets permission_requested true for teacher and assistant that both changed', async () => {
    const tx = makeTxMock();
    const finalRow = { id: 1, name: 'Sunflowers' };
    tx.update.mockReturnValueOnce(makeChain([{ id: 1 }]));
    tx.select
      .mockReturnValueOnce(makeChain([])) // assignedTeacher check
      .mockReturnValueOnce(makeChain([])) // assignedAssistant check
      .mockReturnValueOnce(
        makeChain([
          { teacherId: 99, role: 'teacher' },
          { teacherId: 88, role: 'assistant' },
        ])
      ) // currentTeachers - different from submitted ids
      .mockReturnValueOnce(makeChain([finalRow])); // final rows
    tx.delete.mockReturnValueOnce(makeChain([]));
    const teacherInsertChain = makeChain([]);
    const assistantInsertChain = makeChain([]);
    tx.insert.mockReturnValueOnce(teacherInsertChain).mockReturnValueOnce(assistantInsertChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, assistantId: 8 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(finalRow);
    expect(teacherInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: 5, role: 'teacher', permissionRequested: true })
    );
    expect(assistantInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: 8, role: 'assistant', permissionRequested: true })
    );
  });

  test('200 leaves permission_requested false when resubmitting the same teacher/assistant', async () => {
    const tx = makeTxMock();
    const finalRow = { id: 1, name: 'Sunflowers' };
    tx.update.mockReturnValueOnce(makeChain([{ id: 1 }]));
    tx.select
      .mockReturnValueOnce(makeChain([])) // assignedTeacher check - no conflict (own class excluded)
      .mockReturnValueOnce(makeChain([])) // assignedAssistant check - no conflict
      .mockReturnValueOnce(
        makeChain([
          { teacherId: 5, role: 'teacher' },
          { teacherId: 8, role: 'assistant' },
        ])
      ) // currentTeachers - matches submitted ids
      .mockReturnValueOnce(makeChain([finalRow])); // final rows
    tx.delete.mockReturnValueOnce(makeChain([]));
    const teacherInsertChain = makeChain([]);
    const assistantInsertChain = makeChain([]);
    tx.insert.mockReturnValueOnce(teacherInsertChain).mockReturnValueOnce(assistantInsertChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, assistantId: 8 });

    expect(res.status).toBe(200);
    expect(teacherInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: 5, role: 'teacher', permissionRequested: false })
    );
    expect(assistantInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: 8, role: 'assistant', permissionRequested: false })
    );
  });
});
