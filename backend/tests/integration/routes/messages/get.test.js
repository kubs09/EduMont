import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import { createTestUser, createCleanupTracker } from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { messages } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const sendMessage = async (sender, toUserIds, overrides = {}) => {
  const res = await request(app)
    .post('/api/messages')
    .set('Authorization', authHeader(sender))
    .send({
      to_user_ids: toUserIds,
      subject: 'Fixture Subject',
      content: 'Fixture content',
      ...overrides,
    });
  return res.body;
};

describe('messages routes: get (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/messages');

    expect(res.status).toBe(401);
  });

  describe('GET /api/messages', () => {
    test('groups messages sent to multiple recipients into a single entry with a recipients array', async () => {
      const sender = track('users', await createTestUser('admin'));
      const recipient1 = track('users', await createTestUser('teacher'));
      const recipient2 = track('users', await createTestUser('parent'));

      await sendMessage(sender, [recipient1.id, recipient2.id], {
        subject: 'Group Conversation',
      });
      const persistedRows = await db
        .select()
        .from(messages)
        .where(eq(messages.fromUserId, sender.id));
      persistedRows.forEach((row) => track('messages', row));

      const res = await request(app)
        .get('/api/messages')
        .set('Authorization', authHeader(recipient1));

      expect(res.status).toBe(200);
      const entry = res.body.find((m) => m.subject === 'Group Conversation');
      expect(entry).toBeDefined();
      expect(entry.recipients).toHaveLength(2);
      const recipientIds = entry.recipients.map((r) => r.id).sort();
      expect(recipientIds).toEqual([recipient1.id, recipient2.id].sort());
    });

    test("excludes messages soft-deleted on the caller's side while still showing them to the other party", async () => {
      const sender = track('users', await createTestUser('admin'));
      const recipient = track('users', await createTestUser('teacher'));

      const created = await sendMessage(sender, [recipient.id], { subject: 'To Be Deleted' });
      track('messages', created);

      const deleteRes = await request(app)
        .delete(`/api/messages/${created.id}`)
        .set('Authorization', authHeader(recipient));
      expect(deleteRes.status).toBe(204);

      const recipientView = await request(app)
        .get('/api/messages')
        .set('Authorization', authHeader(recipient));
      expect(recipientView.body.find((m) => m.subject === 'To Be Deleted')).toBeUndefined();

      const senderView = await request(app)
        .get('/api/messages')
        .set('Authorization', authHeader(sender));
      expect(senderView.body.find((m) => m.subject === 'To Be Deleted')).toBeDefined();
    });
  });

  describe('GET /api/messages/:id', () => {
    test("404 when the caller isn't part of the conversation", async () => {
      const sender = track('users', await createTestUser('admin'));
      const recipient = track('users', await createTestUser('teacher'));
      const bystander = track('users', await createTestUser('parent'));

      const created = await sendMessage(sender, [recipient.id]);
      track('messages', created);

      const res = await request(app)
        .get(`/api/messages/${created.id}`)
        .set('Authorization', authHeader(bystander));

      expect(res.status).toBe(404);
    });

    test('persists read_at to the DB on first recipient view, and does not re-trigger it on a second view', async () => {
      const sender = track('users', await createTestUser('admin'));
      const recipient = track('users', await createTestUser('teacher'));

      const created = await sendMessage(sender, [recipient.id]);
      track('messages', created);

      const firstView = await request(app)
        .get(`/api/messages/${created.id}`)
        .set('Authorization', authHeader(recipient));
      expect(firstView.status).toBe(200);
      expect(firstView.body.read_at).toBeNull();

      const [afterFirstView] = await db.select().from(messages).where(eq(messages.id, created.id));
      expect(afterFirstView.readAt).not.toBeNull();

      const secondView = await request(app)
        .get(`/api/messages/${created.id}`)
        .set('Authorization', authHeader(recipient));
      expect(secondView.status).toBe(200);
      expect(secondView.body.read_at).not.toBeNull();

      const thirdView = await request(app)
        .get(`/api/messages/${created.id}`)
        .set('Authorization', authHeader(recipient));
      expect(thirdView.status).toBe(200);
      expect(thirdView.body.read_at).toBe(secondView.body.read_at);

      const [afterThirdView] = await db.select().from(messages).where(eq(messages.id, created.id));
      expect(afterThirdView.readAt).toEqual(afterFirstView.readAt);
    });

    test('viewing as sender never sets read_at', async () => {
      const sender = track('users', await createTestUser('admin'));
      const recipient = track('users', await createTestUser('teacher'));

      const created = await sendMessage(sender, [recipient.id]);
      track('messages', created);

      const res = await request(app)
        .get(`/api/messages/${created.id}`)
        .set('Authorization', authHeader(sender));

      expect(res.status).toBe(200);
      expect(res.body.read_at).toBeNull();
    });
  });
});
