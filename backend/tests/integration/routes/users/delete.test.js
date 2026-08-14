import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestChild,
  createTestClass,
  linkParent,
  linkTeacher,
  createTestMessage,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { children, childParents, classTeachers, messages, users } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('DELETE /api/users/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/users/2');

    expect(res.status).toBe(401);
  });

  test('403 for a non-admin caller', async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const target = track('users', await createTestUser('parent'));

    const res = await request(app)
      .delete(`/api/users/${target.id}`)
      .set('Authorization', authHeader(teacher));

    expect(res.status).toBe(403);

    const [stillThere] = await db.select().from(users).where(eq(users.id, target.id));
    expect(stillThere).toBeDefined();
  });

  test('400 when an admin tries to delete their own account', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete(`/api/users/${admin.id}`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(400);
  });

  test('404 for an unknown target', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete('/api/users/999999999')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(404);
  });

  test('200 cascading delete: classTeachers, childParents/orphaned children, and messages are removed', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(testClass.id, teacher.id));

    const parent = track('users', await createTestUser('parent'));
    const otherParent = track('users', await createTestUser('parent'));
    const orphanedChild = track('children', await createTestChild());
    const keptChild = track('children', await createTestChild());
    track('childParents', await linkParent(orphanedChild.id, parent.id));
    track('childParents', await linkParent(keptChild.id, parent.id));
    track('childParents', await linkParent(keptChild.id, otherParent.id));

    const otherUser = track('users', await createTestUser('teacher'));
    track('messages', await createTestMessage(parent.id, otherUser.id));
    track('messages', await createTestMessage(otherUser.id, parent.id));

    const res = await request(app)
      .delete(`/api/users/${parent.id}`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'User deleted successfully' });

    const [remainingUser] = await db.select().from(users).where(eq(users.id, parent.id));
    expect(remainingUser).toBeUndefined();

    const remainingChildParents = await db
      .select()
      .from(childParents)
      .where(eq(childParents.parentId, parent.id));
    expect(remainingChildParents).toHaveLength(0);

    const [remainingOrphan] = await db.select().from(children).where(eq(children.id, orphanedChild.id));
    expect(remainingOrphan).toBeUndefined();

    const [remainingKeptChild] = await db.select().from(children).where(eq(children.id, keptChild.id));
    expect(remainingKeptChild).toBeDefined();

    const remainingMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.fromUserId, parent.id));
    expect(remainingMessages).toHaveLength(0);
    const remainingReceived = await db
      .select()
      .from(messages)
      .where(eq(messages.toUserId, parent.id));
    expect(remainingReceived).toHaveLength(0);
  });

  test('200 for a teacher target removes their classTeachers rows', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    await linkTeacher(testClass.id, teacher.id);

    const res = await request(app)
      .delete(`/api/users/${teacher.id}`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);

    const remainingLinks = await db
      .select()
      .from(classTeachers)
      .where(eq(classTeachers.teacherId, teacher.id));
    expect(remainingLinks).toHaveLength(0);
  });
});
