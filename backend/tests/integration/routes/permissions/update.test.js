import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  linkTeacher,
  grantPresentationPermission,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { messages, presentationPermissions } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('permissions routes: update (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('POST /api/permissions/accept', () => {
    test('401 without a token', async () => {
      const res = await request(app).post('/api/permissions/accept').send({ class_id: 1 });

      expect(res.status).toBe(401);
    });

    test('400 for a non-integer class_id', async () => {
      const teacher = track('users', await createTestUser('teacher'));

      const res = await request(app)
        .post('/api/permissions/accept')
        .set('Authorization', authHeader(teacher))
        .send({ class_id: 'abc' });

      expect(res.status).toBe(400);
    });

    test('403 when the caller is not a teacher on the class', async () => {
      const outsider = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .post('/api/permissions/accept')
        .set('Authorization', authHeader(outsider))
        .send({ class_id: testClass.id });

      expect(res.status).toBe(403);
    });

    test('404 when there is no pending permission request for the class', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));

      const res = await request(app)
        .post('/api/permissions/accept')
        .set('Authorization', authHeader(teacher))
        .send({ class_id: testClass.id });

      expect(res.status).toBe(404);
    });

    test('200 grants the permission and sends a real message to the requester', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const requester = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const permission = track(
        'presentationPermissions',
        await grantPresentationPermission(requester.id, testClass.id, false, { permissionRequested: true })
      );

      const res = await request(app)
        .post('/api/permissions/accept')
        .set('Authorization', authHeader(teacher))
        .send({ class_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Permission request accepted successfully' });

      const [updated] = await db
        .select()
        .from(presentationPermissions)
        .where(eq(presentationPermissions.id, permission.id));
      expect(updated.granted).toBe(true);

      const messageRows = await db.select().from(messages).where(eq(messages.toUserId, requester.id));
      messageRows.forEach((row) => track('messages', row));
      expect(messageRows).toHaveLength(1);
      expect(messageRows[0]).toMatchObject({
        fromUserId: teacher.id,
        toUserId: requester.id,
        subject: `Your permission request for class "${testClass.name}" has been accepted`,
        content: `Your permission request for presentations in class "${testClass.name}" has been accepted. You now have access to presentations.`,
      });
    });
  });

  describe('POST /api/permissions/deny', () => {
    test('401 without a token', async () => {
      const res = await request(app).post('/api/permissions/deny').send({ class_id: 1 });

      expect(res.status).toBe(401);
    });

    test('400 for a non-integer class_id', async () => {
      const teacher = track('users', await createTestUser('teacher'));

      const res = await request(app)
        .post('/api/permissions/deny')
        .set('Authorization', authHeader(teacher))
        .send({ class_id: 'abc' });

      expect(res.status).toBe(400);
    });

    test('403 when the caller is not a teacher on the class', async () => {
      const outsider = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .post('/api/permissions/deny')
        .set('Authorization', authHeader(outsider))
        .send({ class_id: testClass.id });

      expect(res.status).toBe(403);
    });

    test('404 when there is no pending permission request for the class', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));

      const res = await request(app)
        .post('/api/permissions/deny')
        .set('Authorization', authHeader(teacher))
        .send({ class_id: testClass.id });

      expect(res.status).toBe(404);
    });

    test('200 removes the permission row and sends a real message to the requester', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const requester = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const permission = await grantPresentationPermission(requester.id, testClass.id, false, {
        permissionRequested: true,
      });

      const res = await request(app)
        .post('/api/permissions/deny')
        .set('Authorization', authHeader(teacher))
        .send({ class_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Permission request denied successfully' });

      const remaining = await db
        .select()
        .from(presentationPermissions)
        .where(eq(presentationPermissions.id, permission.id));
      expect(remaining).toHaveLength(0);

      const messageRows = await db.select().from(messages).where(eq(messages.toUserId, requester.id));
      messageRows.forEach((row) => track('messages', row));
      expect(messageRows).toHaveLength(1);
      expect(messageRows[0]).toMatchObject({
        fromUserId: teacher.id,
        toUserId: requester.id,
        subject: `Your permission request for class "${testClass.name}" has been denied`,
        content: `Your permission request for presentations in class "${testClass.name}" has been denied.`,
      });
    });
  });
});
