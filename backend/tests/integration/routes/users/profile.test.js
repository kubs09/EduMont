import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
import { signTestToken } from '../../../helpers/auth.js';
import { createTestUser, createCleanupTracker } from '../../../helpers/fixtures.js';

const { compare } = bcryptjs;

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { users } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('profile routes (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('PUT /api/users/:id', () => {
    test('persists a profile update and it is re-queryable', async () => {
      const user = track('users', await createTestUser('parent'));

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', authHeader(user))
        .send({ firstname: 'Updated', surname: 'Name', email: user.email, phone: '555-123-4567' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        firstname: 'Updated',
        surname: 'Name',
        phone: '555-123-4567',
      });

      const [persisted] = await db.select().from(users).where(eq(users.id, user.id));
      expect(persisted).toMatchObject({
        firstname: 'Updated',
        surname: 'Name',
        phone: '555-123-4567',
      });
    });

    test('400 for a duplicate email against a seeded second user', async () => {
      const user = track('users', await createTestUser('parent'));
      const otherUser = track('users', await createTestUser('parent'));

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', authHeader(user))
        .send({
          firstname: user.firstname,
          surname: user.surname,
          email: otherUser.email,
          phone: '',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Email already in use' });
    });
  });

  describe('PUT /api/users/:id/password', () => {
    test('changes the password, verified by a subsequent comparePassword check', async () => {
      const user = track('users', await createTestUser('parent'));

      const res = await request(app)
        .put(`/api/users/${user.id}/password`)
        .set('Authorization', authHeader(user))
        .send({ currentPassword: 'fixturePassword123', newPassword: 'brandNewPassword456' });

      expect(res.status).toBe(200);

      const [persisted] = await db.select().from(users).where(eq(users.id, user.id));
      const matches = await compare('brandNewPassword456', persisted.password);
      expect(matches).toBe(true);
    });

    test('401 for the wrong current password', async () => {
      const user = track('users', await createTestUser('parent'));

      const res = await request(app)
        .put(`/api/users/${user.id}/password`)
        .set('Authorization', authHeader(user))
        .send({ currentPassword: 'not-the-real-password', newPassword: 'brandNewPassword456' });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/:id/notifications', () => {
    test('persists the messageNotifications flag', async () => {
      const user = track('users', await createTestUser('parent'));

      const res = await request(app)
        .put(`/api/users/${user.id}/notifications`)
        .set('Authorization', authHeader(user))
        .send({ messageNotifications: false });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ messageNotifications: false });

      const [persisted] = await db.select().from(users).where(eq(users.id, user.id));
      expect(persisted.messageNotifications).toBe(false);
    });
  });
});
