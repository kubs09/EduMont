import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import { createTestUser, createTestMessage, createCleanupTracker } from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { messages } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('DELETE /api/messages/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/messages/1');

    expect(res.status).toBe(401);
  });

  test("404 when the message doesn't exist", async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete('/api/messages/999999')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(404);
  });

  test('404 when the caller is neither sender nor recipient', async () => {
    const sender = track('users', await createTestUser('admin'));
    const recipient = track('users', await createTestUser('teacher'));
    const bystander = track('users', await createTestUser('parent'));
    const message = track('messages', await createTestMessage(sender.id, recipient.id));

    const res = await request(app)
      .delete(`/api/messages/${message.id}`)
      .set('Authorization', authHeader(bystander));

    expect(res.status).toBe(404);
  });

  test('204 on success: sets deletedBySender when the caller is the sender, row still exists', async () => {
    const sender = track('users', await createTestUser('admin'));
    const recipient = track('users', await createTestUser('teacher'));
    const message = track('messages', await createTestMessage(sender.id, recipient.id));

    const res = await request(app)
      .delete(`/api/messages/${message.id}`)
      .set('Authorization', authHeader(sender));

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const [persisted] = await db.select().from(messages).where(eq(messages.id, message.id));
    expect(persisted).toBeDefined();
    expect(persisted.deletedBySender).toBe(true);
    expect(persisted.deletedByRecipient).toBe(false);
  });

  test('204 on success: sets deletedByRecipient when the caller is the recipient, row still exists', async () => {
    const sender = track('users', await createTestUser('admin'));
    const recipient = track('users', await createTestUser('teacher'));
    const message = track('messages', await createTestMessage(sender.id, recipient.id));

    const res = await request(app)
      .delete(`/api/messages/${message.id}`)
      .set('Authorization', authHeader(recipient));

    expect(res.status).toBe(204);

    const [persisted] = await db.select().from(messages).where(eq(messages.id, message.id));
    expect(persisted).toBeDefined();
    expect(persisted.deletedByRecipient).toBe(true);
    expect(persisted.deletedBySender).toBe(false);
  });

  test("the other party's view of the message is unaffected by a soft delete", async () => {
    const sender = track('users', await createTestUser('admin'));
    const recipient = track('users', await createTestUser('teacher'));
    const message = track('messages', await createTestMessage(sender.id, recipient.id));

    const res = await request(app)
      .delete(`/api/messages/${message.id}`)
      .set('Authorization', authHeader(recipient));
    expect(res.status).toBe(204);

    const senderView = await request(app)
      .get(`/api/messages/${message.id}`)
      .set('Authorization', authHeader(sender));

    expect(senderView.status).toBe(200);
    expect(senderView.body.deleted_by_recipient).toBe(true);
  });
});
