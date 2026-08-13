import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import jsonwebtoken from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { makeChain } from '../../../helpers/drizzleMock.js';

const { decode } = jsonwebtoken;
const { hash, genSalt } = bcryptjs;

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

describe('POST /api/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('400 when email is missing', async () => {
    const res = await request(app).post('/api/login').send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 when password is missing', async () => {
    const res = await request(app).post('/api/login').send({ email: 'user@example.com' });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('401 for an unknown email', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nouser@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  test('401 for a wrong password', async () => {
    const salt = await genSalt(10);
    const wrongHash = await hash('a-different-password', salt);
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 1, email: 'user@example.com', hash: wrongHash, role: 'parent' }])
    );

    const res = await request(app)
      .post('/api/login')
      .send({ email: 'user@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  test('200 with token and user fields for valid credentials', async () => {
    const salt = await genSalt(10);
    const correctHash = await hash('password123', salt);
    dbMock.select.mockReturnValueOnce(
      makeChain([
        {
          id: 42,
          email: 'user@example.com',
          hash: correctHash,
          firstname: 'Ada',
          surname: 'Lovelace',
          role: 'admin',
          messageNotifications: true,
          phone: '555-1234',
        },
      ])
    );

    const res = await request(app)
      .post('/api/login')
      .send({ email: 'user@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    const decoded = decode(res.body.token);
    expect(decoded.id).toBe(42);
    expect(decoded.role).toBe('admin');
    expect(res.body).toMatchObject({
      id: 42,
      firstname: 'Ada',
      surname: 'Lovelace',
      role: 'admin',
      email: 'user@example.com',
      messageNotifications: true,
      phone: '555-1234',
    });
  });
});
