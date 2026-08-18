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

describe('GET /api/check-token/:token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns valid=false when the token does not exist', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app).get('/api/check-token/unknown-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: false, expired: false });
  });

  test('returns valid=true, expired=false for a live token', async () => {
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 1, resetToken: 'tok', resetTokenExpiry: expiry }])
    );

    const res = await request(app).get('/api/check-token/tok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: true, expired: false });
  });

  test('returns expired=true for a stale token', async () => {
    const expiry = new Date(Date.now() - 60 * 60 * 1000);
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 1, resetToken: 'tok', resetTokenExpiry: expiry }])
    );

    const res = await request(app).get('/api/check-token/tok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: true, expired: true });
  });
});
