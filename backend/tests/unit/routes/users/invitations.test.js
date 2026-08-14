import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), transaction: jest.fn() };
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
const { invitations, users } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('POST /api/users (invitations)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/users').send({ email: 'x@example.com', role: 'parent' });

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('403 for a non-admin caller (blocks the invitation before it can be sent)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ email: 'sneaky-admin@example.com', role: 'admin', language: 'en' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only admins can send invitations' });
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.transaction).not.toHaveBeenCalled();
    expect(mailMock.sendEmail).not.toHaveBeenCalled();
  });

  test('409 user_exists when the email already belongs to a user', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 7 }]));

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ email: 'existing@example.com', role: 'parent', language: 'en' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'user_exists' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('409 invitation_exists when a non-expired invitation already exists', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(makeChain([{ id: 3 }]));

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ email: 'pending@example.com', role: 'parent', language: 'en' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'invitation_exists' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('201 happy path inserts the invitation and emails the correct token/role/language', async () => {
    const insertChain = makeChain(undefined);
    const tx = { insert: jest.fn().mockReturnValueOnce(insertChain) };
    dbMock.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ email: 'invitee@example.com', role: 'teacher', language: 'en' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'Invitation sent successfully' });
    expect(tx.insert.mock.calls[0][0]).toBe(invitations);
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'invitee@example.com',
        role: 'teacher',
        token: expect.any(String),
        expiresAt: expect.any(Date),
      })
    );

    const insertedToken = insertChain.values.mock.calls[0][0].token;
    expect(mailMock.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'invitee@example.com',
        html: expect.stringContaining(insertedToken),
      })
    );
  });

  test('500 if the transaction throws', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ email: 'invitee@example.com', role: 'teacher', language: 'en' });

    expect(res.status).toBe(500);
  });
});

describe('POST /api/users/register/:token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('400 for an invalid or expired token (and does not require an Authorization header)', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .post('/api/users/register/some-token')
      .send({ firstname: 'New', surname: 'User', password: 'newUserPassword123' });

    expect(res.status).not.toBe(401);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid or expired invitation' });
  });

  test('201 happy path creates the user and consumes the invitation', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 9, email: 'invitee@example.com', role: 'teacher' }])
    );
    const tx = {
      insert: jest.fn().mockReturnValueOnce(
        makeChain([{ id: 50, email: 'invitee@example.com', role: 'teacher' }])
      ),
      delete: jest.fn().mockReturnValueOnce(makeChain([])),
    };
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/users/register/valid-token')
      .send({ firstname: 'Brand', surname: 'New', password: 'newUserPassword123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 50, email: 'invitee@example.com', role: 'teacher' });
    expect(tx.insert.mock.calls[0][0]).toBe(users);
    expect(tx.delete.mock.calls[0][0]).toBe(invitations);
  });

  test('500 on an unexpected error', async () => {
    dbMock.select.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app)
      .post('/api/users/register/some-token')
      .send({ firstname: 'New', surname: 'User', password: 'newUserPassword123' });

    expect(res.status).toBe(500);
  });
});
