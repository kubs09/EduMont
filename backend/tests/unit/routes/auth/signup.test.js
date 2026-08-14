import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';

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

const validSignup = {
  email: 'newuser@example.com',
  password: 'password123',
  firstName: 'Ada',
  lastName: 'Lovelace',
};

describe('POST /api/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('400 for missing email', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ ...validSignup, email: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for missing password', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ ...validSignup, password: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ ...validSignup, password: 'abc12' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ ...validSignup, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for missing first/last name', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ ...validSignup, firstName: undefined, lastName: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 "Email already registered" when the email already exists', async () => {
    const tx = {
      select: jest.fn().mockReturnValueOnce(makeChain([{ id: 1 }])),
      insert: jest.fn(),
    };
    dbMock.transaction.mockImplementationOnce((cb) => cb(tx));

    const res = await request(app).post('/api/signup').send(validSignup);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already registered');
    expect(tx.insert).not.toHaveBeenCalled();
  });

  test('201 with created user on success', async () => {
    const tx = {
      select: jest.fn().mockReturnValueOnce(makeChain([])),
      insert: jest.fn().mockReturnValueOnce(
        makeChain([
          { id: 7, email: 'newuser@example.com', firstname: 'Ada', surname: 'Lovelace', role: 'parent' },
        ])
      ),
    };
    dbMock.transaction.mockImplementationOnce((cb) => cb(tx));

    const res = await request(app).post('/api/signup').send(validSignup);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      id: 7,
      email: 'newuser@example.com',
      firstname: 'Ada',
      surname: 'Lovelace',
      role: 'parent',
    });
    expect(res.body.user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });
});
