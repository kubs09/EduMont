import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestInvitation,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

const mailMock = { sendEmail: jest.fn() };

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: mailMock,
  sendEmail: mailMock.sendEmail,
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { invitations, users } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('users invitations (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await cleanup();
  });

  describe('POST /api/users', () => {
    test('401 without a token', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: 'x@example.com', role: 'parent' });

      expect(res.status).toBe(401);
    });

    test('403 for a non-admin caller', async () => {
      const teacher = track('users', await createTestUser('teacher'));

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader(teacher))
        .send({ email: 'x@example.com', role: 'parent' });

      expect(res.status).toBe(403);
    });

    test('409 user_exists for an already-registered email', async () => {
      const admin = track('users', await createTestUser('admin'));
      const existing = track('users', await createTestUser('parent'));

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader(admin))
        .send({ email: existing.email, role: 'parent' });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'user_exists' });
    });

    test('409 invitation_exists for a non-expired pending invitation', async () => {
      const admin = track('users', await createTestUser('admin'));
      const pending = track(
        'invitations',
        await createTestInvitation({ email: 'pending@example.com' })
      );

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader(admin))
        .send({ email: pending.email, role: 'parent' });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'invitation_exists' });
    });

    test('201 creates a real invitation row and emails the invitee', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', authHeader(admin))
        .send({ email: 'newinvitee@example.com', role: 'teacher', language: 'en' });

      expect(res.status).toBe(201);

      const [persisted] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.email, 'newinvitee@example.com'));
      track('invitations', persisted);
      expect(persisted).toMatchObject({ email: 'newinvitee@example.com', role: 'teacher' });
      expect(mailMock.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'newinvitee@example.com' })
      );
    });
  });

  describe('POST /api/users/register/:token', () => {
    test('400 for an invalid token', async () => {
      const res = await request(app)
        .post('/api/users/register/not-a-real-token')
        .send({ firstname: 'New', surname: 'User', password: 'newUserPassword123' });

      expect(res.status).toBe(400);
    });

    test('400 for an expired token', async () => {
      const expired = track(
        'invitations',
        await createTestInvitation({ expiresAt: new Date(Date.now() - 1000) })
      );

      const res = await request(app)
        .post(`/api/users/register/${expired.token}`)
        .send({ firstname: 'New', surname: 'User', password: 'newUserPassword123' });

      expect(res.status).toBe(400);
    });

    test('201 creates the user from the invitation and consumes it', async () => {
      const invitation = track('invitations', await createTestInvitation({ role: 'teacher' }));

      const res = await request(app)
        .post(`/api/users/register/${invitation.token}`)
        .send({ firstname: 'Brand', surname: 'New', password: 'newUserPassword123' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: invitation.email, role: 'teacher' });
      track('users', res.body);

      const [createdUser] = await db.select().from(users).where(eq(users.email, invitation.email));
      expect(createdUser).toMatchObject({ firstname: 'Brand', surname: 'New', role: 'teacher' });

      const [remainingInvitation] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id));
      expect(remainingInvitation).toBeUndefined();
    });
  });
});
