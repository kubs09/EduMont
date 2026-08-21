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

const { children, childParents, classTeachers, messages, users } =
  await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('DELETE /api/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/users/2');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('403 for a non-admin caller (blocks the deletion before it can happen)', async () => {
    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only admins can delete users' });
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-integer id', async () => {
    const res = await request(app)
      .delete('/api/users/abc')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 when an admin tries to delete their own account', async () => {
    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'You cannot delete your own account' });
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('404 when the target user does not exist', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .delete('/api/users/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(404);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('200 for a non-parent target, with no orphan-cleanup branch', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 2, role: 'teacher' }]));
    const tx = { select: jest.fn(), delete: jest.fn() };
    tx.delete
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'User deleted successfully' });
    expect(tx.select).not.toHaveBeenCalled();
    expect(tx.delete).toHaveBeenCalledTimes(3);
    expect(tx.delete.mock.calls[0][0]).toBe(classTeachers);
    expect(tx.delete.mock.calls[1][0]).toBe(messages);
    expect(tx.delete.mock.calls[2][0]).toBe(users);
  });

  test('200 for a parent target: an orphaned child is deleted, a child with a remaining parent is kept', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 3, role: 'parent' }]));
    const tx = { select: jest.fn(), delete: jest.fn() };
    tx.select
      .mockReturnValueOnce(makeChain([{ childId: 10 }, { childId: 20 }]))
      .mockReturnValueOnce(makeChain([{ id: 10 }]));
    tx.delete
      .mockReturnValueOnce(makeChain([])) // classTeachers
      .mockReturnValueOnce(makeChain([])) // childParents
      .mockReturnValueOnce(makeChain([])) // children (orphan cleanup)
      .mockReturnValueOnce(makeChain([])) // messages
      .mockReturnValueOnce(makeChain([])); // users
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/users/3')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'User deleted successfully' });
    expect(tx.select).toHaveBeenCalledTimes(2);
    expect(tx.delete).toHaveBeenCalledTimes(5);
    expect(tx.delete.mock.calls[0][0]).toBe(classTeachers);
    expect(tx.delete.mock.calls[1][0]).toBe(childParents);
    expect(tx.delete.mock.calls[2][0]).toBe(children);
    expect(tx.delete.mock.calls[3][0]).toBe(messages);
    expect(tx.delete.mock.calls[4][0]).toBe(users);
  });

  test('500 on an unexpected transaction error', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 5, role: 'teacher' }]));
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .delete('/api/users/5')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(500);
  });
});
