import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import { createTestUser, createCleanupTracker } from '../../../helpers/fixtures.js';

const mailMock = { sendEmail: jest.fn() };

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: mailMock,
  sendEmail: mailMock.sendEmail,
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { messages, users } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('POST /api/messages (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ to_user_ids: [1], subject: 'Hi', content: 'Hello' });

    expect(res.status).toBe(401);
  });

  test('403 for a disallowed recipient', async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const unlinkedParent = track('users', await createTestUser('parent'));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader(teacher))
      .send({ to_user_ids: [unlinkedParent.id], subject: 'Hi', content: 'Hello' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Some recipients are not allowed' });
  });

  test('201 sending to a single allowed recipient', async () => {
    const admin = track('users', await createTestUser('admin'));
    const recipient = track('users', await createTestUser('teacher'));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader(admin))
      .send({ to_user_ids: [recipient.id], subject: 'Hi', content: 'Hello there' });

    expect(res.status).toBe(201);
    track('messages', res.body);

    const [persisted] = await db.select().from(messages).where(eq(messages.id, res.body.id));
    expect(persisted).toMatchObject({
      fromUserId: admin.id,
      toUserId: recipient.id,
      subject: 'Hi',
      content: 'Hello there',
    });
  });

  test('201 sending to multiple recipients creates one row per recipient sharing subject/content', async () => {
    const admin = track('users', await createTestUser('admin'));
    const recipient1 = track('users', await createTestUser('teacher'));
    const recipient2 = track('users', await createTestUser('parent'));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader(admin))
      .send({
        to_user_ids: [recipient1.id, recipient2.id],
        subject: 'Group Hi',
        content: 'Hello everyone',
      });

    expect(res.status).toBe(201);

    const persistedRows = await db.select().from(messages).where(eq(messages.fromUserId, admin.id));
    persistedRows.forEach((row) => track('messages', row));

    expect(persistedRows).toHaveLength(2);
    const recipientIds = persistedRows.map((r) => r.toUserId).sort();
    expect(recipientIds).toEqual([recipient1.id, recipient2.id].sort());
    persistedRows.forEach((row) => {
      expect(row.subject).toBe('Group Hi');
      expect(row.content).toBe('Hello everyone');
      expect(row.createdAt).toEqual(persistedRows[0].createdAt);
    });
  });

  test('notification email is sent only to recipients with messageNotifications true', async () => {
    const admin = track('users', await createTestUser('admin'));
    const notifyOff = track('users', await createTestUser('teacher'));
    const notifyOn = track('users', await createTestUser('parent'));
    await db.update(users).set({ messageNotifications: false }).where(eq(users.id, notifyOff.id));
    await db.update(users).set({ messageNotifications: true }).where(eq(users.id, notifyOn.id));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader(admin))
      .send({
        to_user_ids: [notifyOff.id, notifyOn.id],
        subject: 'Reminder',
        content: 'Please read this',
      });

    expect(res.status).toBe(201);
    const persistedRows = await db.select().from(messages).where(eq(messages.fromUserId, admin.id));
    persistedRows.forEach((row) => track('messages', row));

    expect(mailMock.sendEmail).toHaveBeenCalledTimes(1);
    expect(mailMock.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: notifyOn.email }));
  });
});
