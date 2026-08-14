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

const validToken = 'a'.repeat(64);

describe('POST /api/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects a malformed token', async () => {
    const res = await request(app)
      .post('/api/reset-password')
      .send({ token: 'too-short', password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/format/i);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('rejects an unknown token', async () => {
    const tx = { select: jest.fn().mockReturnValueOnce(makeChain([])), update: jest.fn() };
    dbMock.transaction.mockImplementationOnce((cb) => cb(tx));

    const res = await request(app)
      .post('/api/reset-password')
      .send({ token: validToken, password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  test('rejects an expired token', async () => {
    const tx = {
      select: jest.fn().mockReturnValueOnce(
        makeChain([{ id: 1, resetToken: validToken, resetTokenExpiry: new Date(Date.now() - 1000) }])
      ),
      update: jest.fn(),
    };
    dbMock.transaction.mockImplementationOnce((cb) => cb(tx));

    const res = await request(app)
      .post('/api/reset-password')
      .send({ token: validToken, password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test('resets the password for a valid token', async () => {
    const tx = {
      select: jest.fn().mockReturnValueOnce(
        makeChain([{ id: 1, resetToken: validToken, resetTokenExpiry: new Date(Date.now() + 60000) }])
      ),
      update: jest.fn().mockReturnValueOnce(makeChain([{ id: 1 }])),
    };
    dbMock.transaction.mockImplementationOnce((cb) => cb(tx));

    const res = await request(app)
      .post('/api/reset-password')
      .send({ token: validToken, password: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/successful/i);
  });
});
