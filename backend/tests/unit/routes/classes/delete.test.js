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
const { classChildren, classTeachers, classes } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const makeTxMock = () => ({ delete: jest.fn() });

describe('DELETE /api/classes/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/classes/1');

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 for non-admin', async () => {
    const res = await request(app)
      .delete('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

    expect(res.status).toBe(403);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-integer/non-positive :id', async () => {
    const res = await request(app)
      .delete('/api/classes/0')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('200 on success, deleting classTeachers and classChildren before classes', async () => {
    const tx = makeTxMock();
    tx.delete
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/classes/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Class deleted successfully' });
    expect(tx.delete).toHaveBeenCalledTimes(3);
    expect(tx.delete.mock.calls[0][0]).toBe(classTeachers);
    expect(tx.delete.mock.calls[1][0]).toBe(classChildren);
    expect(tx.delete.mock.calls[2][0]).toBe(classes);
  });

  test('200 for an unknown class id too, since the route has no existence check', async () => {
    const tx = makeTxMock();
    tx.delete
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/classes/999999999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Class deleted successfully' });
  });
});
