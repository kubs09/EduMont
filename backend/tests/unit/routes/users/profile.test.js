import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import bcryptjs from 'bcryptjs';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

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

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('PUT /api/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).put('/api/users/1').send({});

    expect(res.status).toBe(401);
  });

  test('403 for a non-self target', async () => {
    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ firstname: 'A', surname: 'B', email: 'a@example.com', phone: '' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'You can only update your own profile' });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('400 when firstname is missing', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ firstname: '', surname: 'Doe', email: 'valid@example.com', phone: '' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'First name is required' });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('400 when surname is missing', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ firstname: 'John', surname: '', email: 'valid@example.com', phone: '' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Surname is required' });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('400 for an invalid email format', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ firstname: 'John', surname: 'Doe', email: 'not-an-email', phone: '' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Valid email is required' });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('400 for an invalid phone format', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ firstname: 'John', surname: 'Doe', email: 'valid@example.com', phone: '123' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid phone number format' });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('400 for a duplicate email (postgres 23505)', async () => {
    const dbError = new Error('duplicate key value violates unique constraint');
    dbError.code = '23505';
    dbMock.update.mockImplementationOnce(() => {
      throw dbError;
    });

    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ firstname: 'John', surname: 'Doe', email: 'taken@example.com', phone: '' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Email already in use' });
  });

  test('404 when the user no longer exists', async () => {
    dbMock.update.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ firstname: 'John', surname: 'Doe', email: 'valid@example.com', phone: '' });

    expect(res.status).toBe(404);
  });

  test('200 on a successful profile update', async () => {
    dbMock.update.mockReturnValueOnce(
      makeChain([
        {
          id: 1,
          firstname: 'Jane',
          surname: 'Doe',
          email: 'jane@example.com',
          phone: '555-123-4567',
          role: 'parent',
        },
      ])
    );

    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({
        firstname: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        phone: '555-123-4567',
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      firstname: 'Jane',
      surname: 'Doe',
      email: 'jane@example.com',
      phone: '555-123-4567',
      role: 'parent',
    });
  });

  test('500 on an unexpected error', async () => {
    dbMock.update.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ firstname: 'John', surname: 'Doe', email: 'valid@example.com', phone: '' });

    expect(res.status).toBe(500);
  });
});

describe('PUT /api/users/:id/password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .put('/api/users/1/password')
      .send({ currentPassword: 'a', newPassword: 'b' });

    expect(res.status).toBe(401);
  });

  test('403 for a non-self target', async () => {
    const res = await request(app)
      .put('/api/users/2/password')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ currentPassword: 'old-password', newPassword: 'new-password123' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'You can only change your own password' });
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('404 when the user no longer exists', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/users/1/password')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ currentPassword: 'old-password', newPassword: 'new-password123' });

    expect(res.status).toBe(404);
  });

  test('401 when the current password is wrong', async () => {
    const salt = await genSalt(10);
    const storedHash = await hash('the-real-password', salt);
    dbMock.select.mockReturnValueOnce(makeChain([{ password: storedHash }]));

    const res = await request(app)
      .put('/api/users/1/password')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ currentPassword: 'wrong-password', newPassword: 'new-password123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Current password is incorrect' });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('200 on a successful password change', async () => {
    const salt = await genSalt(10);
    const storedHash = await hash('the-real-password', salt);
    dbMock.select.mockReturnValueOnce(makeChain([{ password: storedHash }]));
    dbMock.update.mockReturnValueOnce(makeChain(undefined));

    const res = await request(app)
      .put('/api/users/1/password')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ currentPassword: 'the-real-password', newPassword: 'new-password123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Password updated successfully' });
    expect(dbMock.update).toHaveBeenCalled();
  });

  test('500 on an unexpected error', async () => {
    dbMock.select.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app)
      .put('/api/users/1/password')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ currentPassword: 'a', newPassword: 'new-password123' });

    expect(res.status).toBe(500);
  });
});

describe('PUT /api/users/:id/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .put('/api/users/1/notifications')
      .send({ messageNotifications: true });

    expect(res.status).toBe(401);
  });

  test('403 for a non-self target', async () => {
    const res = await request(app)
      .put('/api/users/2/notifications')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ messageNotifications: true });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Unauthorized to update other users settings' });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('404 when the user no longer exists', async () => {
    dbMock.update.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/users/1/notifications')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ messageNotifications: true });

    expect(res.status).toBe(404);
  });

  test('200 on success', async () => {
    dbMock.update.mockReturnValueOnce(makeChain([{ messageNotifications: false }]));

    const res = await request(app)
      .put('/api/users/1/notifications')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ messageNotifications: false });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ messageNotifications: false });
  });

  test('500 on an unexpected error', async () => {
    dbMock.update.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const res = await request(app)
      .put('/api/users/1/notifications')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }))
      .send({ messageNotifications: true });

    expect(res.status).toBe(500);
  });
});
