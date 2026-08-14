import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { execute: jest.fn() };

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

describe('GET /api/messages/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/messages/users');

    expect(res.status).toBe(401);
    expect(dbMock.execute).not.toHaveBeenCalled();
  });

  test('200 returning result.rows verbatim for an admin caller', async () => {
    const rows = [{ id: 2, firstname: 'Ada', surname: 'Lovelace', role: 'teacher' }];
    dbMock.execute.mockResolvedValueOnce({ rows });

    const res = await request(app)
      .get('/api/messages/users')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
    expect(dbMock.execute).toHaveBeenCalledTimes(1);
  });

  test('200 returning result.rows verbatim for a teacher caller', async () => {
    const rows = [{ id: 3, firstname: 'Grace', surname: 'Hopper', role: 'admin' }];
    dbMock.execute.mockResolvedValueOnce({ rows });

    const res = await request(app)
      .get('/api/messages/users')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
    expect(dbMock.execute).toHaveBeenCalledTimes(1);
  });

  test('200 returning result.rows verbatim for a parent caller', async () => {
    const rows = [{ id: 4, firstname: 'Marie', surname: 'Curie', role: 'teacher' }];
    dbMock.execute.mockResolvedValueOnce({ rows });

    const res = await request(app)
      .get('/api/messages/users')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
    expect(dbMock.execute).toHaveBeenCalledTimes(1);
  });

  test('500 when db.execute rejects', async () => {
    dbMock.execute.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .get('/api/messages/users')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(500);
  });
});
