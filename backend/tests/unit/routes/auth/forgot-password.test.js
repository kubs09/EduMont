import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';

const dbMock = { select: jest.fn(), update: jest.fn(), transaction: jest.fn() };
const mailMock = { sendEmail: jest.fn() };

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: mailMock,
  sendEmail: mailMock.sendEmail,
}));

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

const { default: app } = await import('#backend/server.js');

describe('POST /api/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 for an invalid email', async () => {
    const res = await request(app).post('/api/forgot-password').send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('returns success without revealing whether the account exists', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .post('/api/forgot-password')
      .send({ email: 'nouser@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(dbMock.update).not.toHaveBeenCalled();
    expect(mailMock.sendEmail).not.toHaveBeenCalled();
  });

  test('generates a reset token and emails an existing user', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 1, email: 'user@example.com', firstname: 'A', surname: 'B' }])
    );
    dbMock.update.mockReturnValueOnce(makeChain(undefined));

    const res = await request(app).post('/api/forgot-password').send({ email: 'user@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(dbMock.update).toHaveBeenCalled();
    expect(mailMock.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' })
    );
  });
});
