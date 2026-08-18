import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq, and } from 'drizzle-orm';
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

describe('permissions routes: request (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('GET /api/permissions/check', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/permissions/check').query({ resource_id: 1 });

      expect(res.status).toBe(401);
    });

    test('400 for a non-integer resource_id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/permissions/check')
        .set('Authorization', authHeader(admin))
        .query({ resource_id: 'abc' });

      expect(res.status).toBe(400);
    });

    test('403 for a non-admin caller', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get('/api/permissions/check')
        .set('Authorization', authHeader(teacher))
        .query({ resource_id: testClass.id });

      expect(res.status).toBe(403);
    });

    test('404 when the class does not exist', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/permissions/check')
        .set('Authorization', authHeader(admin))
        .query({ resource_id: 999999999 });

      expect(res.status).toBe(404);
    });

    test('200 already_requested: false when there is no pending request', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get('/api/permissions/check')
        .set('Authorization', authHeader(admin))
        .query({ resource_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ already_requested: false });
    });

    test('200 already_requested: true when a request is pending', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      track(
        'presentationPermissions',
        await grantPresentationPermission(admin.id, testClass.id, false, {
          permissionRequested: true,
        })
      );

      const res = await request(app)
        .get('/api/permissions/check')
        .set('Authorization', authHeader(admin))
        .query({ resource_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ already_requested: true });
    });
  });

  describe('GET /api/permissions/granted', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/permissions/granted').query({ resource_id: 1 });

      expect(res.status).toBe(401);
    });

    test('400 for a non-integer resource_id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/permissions/granted')
        .set('Authorization', authHeader(admin))
        .query({ resource_id: 'abc' });

      expect(res.status).toBe(400);
    });

    test('403 for a non-admin caller', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get('/api/permissions/granted')
        .set('Authorization', authHeader(teacher))
        .query({ resource_id: testClass.id });

      expect(res.status).toBe(403);
    });

    test('200 has_access: false when there is no permission row', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get('/api/permissions/granted')
        .set('Authorization', authHeader(admin))
        .query({ resource_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ has_access: false });
    });

    test('200 has_access: true when the permission has been granted', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      track(
        'presentationPermissions',
        await grantPresentationPermission(admin.id, testClass.id, true)
      );

      const res = await request(app)
        .get('/api/permissions/granted')
        .set('Authorization', authHeader(admin))
        .query({ resource_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ has_access: true });
    });
  });

  describe('GET /api/permissions/pending', () => {
    test('401 without a token', async () => {
      const res = await request(app).get('/api/permissions/pending').query({ class_id: 1 });

      expect(res.status).toBe(401);
    });

    test('400 for a non-integer class_id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/permissions/pending')
        .set('Authorization', authHeader(admin))
        .query({ class_id: 'abc' });

      expect(res.status).toBe(400);
    });

    test('403 when the caller is neither admin nor a teacher on the class', async () => {
      const outsider = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get('/api/permissions/pending')
        .set('Authorization', authHeader(outsider))
        .query({ class_id: testClass.id });

      expect(res.status).toBe(403);
    });

    test('200 with the pending request for an admin caller', async () => {
      const admin = track('users', await createTestUser('admin'));
      const requester = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      track(
        'presentationPermissions',
        await grantPresentationPermission(requester.id, testClass.id, false, {
          permissionRequested: true,
        })
      );

      const res = await request(app)
        .get('/api/permissions/pending')
        .set('Authorization', authHeader(admin))
        .query({ class_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body.has_pending).toBe(true);
      expect(res.body.requests).toHaveLength(1);
      expect(res.body.requests[0]).toMatchObject({
        admin_id: requester.id,
        class_id: testClass.id,
      });
    });

    test('200 with the pending request for a teacher-of-class caller', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const requester = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      track(
        'presentationPermissions',
        await grantPresentationPermission(requester.id, testClass.id, false, {
          permissionRequested: true,
        })
      );

      const res = await request(app)
        .get('/api/permissions/pending')
        .set('Authorization', authHeader(teacher))
        .query({ class_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body.has_pending).toBe(true);
      expect(res.body.requests).toHaveLength(1);
      expect(res.body.requests[0]).toMatchObject({
        admin_id: requester.id,
        class_id: testClass.id,
      });
    });
  });

  describe('POST /api/permissions/request', () => {
    test('401 without a token', async () => {
      const res = await request(app).post('/api/permissions/request').send({ resource_id: 1 });

      expect(res.status).toBe(401);
    });

    test('400 for a non-integer resource_id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .post('/api/permissions/request')
        .set('Authorization', authHeader(admin))
        .send({ resource_id: 'abc' });

      expect(res.status).toBe(400);
    });

    test('403 for a non-admin caller', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .post('/api/permissions/request')
        .set('Authorization', authHeader(teacher))
        .send({ resource_id: testClass.id });

      expect(res.status).toBe(403);
    });

    test('404 when the requester does not exist', async () => {
      const fakeAdmin = { id: 999999999, role: 'admin' };

      const res = await request(app)
        .post('/api/permissions/request')
        .set('Authorization', authHeader(fakeAdmin))
        .send({ resource_id: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Requester not found' });
    });

    test('404 when the class does not exist', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .post('/api/permissions/request')
        .set('Authorization', authHeader(admin))
        .send({ resource_id: 999999999 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Class not found' });
    });

    test('200 already_requested: true and no new message when a request is already pending', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      track(
        'presentationPermissions',
        await grantPresentationPermission(admin.id, testClass.id, false, {
          permissionRequested: true,
        })
      );

      const res = await request(app)
        .post('/api/permissions/request')
        .set('Authorization', authHeader(admin))
        .send({ resource_id: testClass.id });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Permission request already exists and is pending',
        already_requested: true,
      });

      const messageRows = await db.select().from(messages).where(eq(messages.fromUserId, admin.id));
      expect(messageRows).toHaveLength(0);
    });

    test('201 sends a real message to each teacher on the class', async () => {
      const admin = track('users', await createTestUser('admin'));
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));

      const res = await request(app)
        .post('/api/permissions/request')
        .set('Authorization', authHeader(admin))
        .send({ resource_id: testClass.id });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: 'Permission request sent successfully',
        recipients_count: 1,
        already_requested: false,
      });

      const [createdPermission] = await db
        .select()
        .from(presentationPermissions)
        .where(
          and(
            eq(presentationPermissions.adminId, admin.id),
            eq(presentationPermissions.classId, testClass.id)
          )
        );
      track('presentationPermissions', createdPermission);
      expect(createdPermission).toMatchObject({ granted: false, permissionRequested: true });

      const messageRows = await db.select().from(messages).where(eq(messages.toUserId, teacher.id));
      messageRows.forEach((row) => track('messages', row));
      expect(messageRows).toHaveLength(1);
      expect(messageRows[0]).toMatchObject({
        fromUserId: admin.id,
        toUserId: teacher.id,
        subject: 'Permission Request',
      });
      expect(messageRows[0].content).toContain(`Class: ${testClass.name}`);
    });

    test('201 sends a real self-addressed [SYSTEM LOG] message when the class has zero teachers', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .post('/api/permissions/request')
        .set('Authorization', authHeader(admin))
        .send({ resource_id: testClass.id });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: 'Permission request sent successfully',
        recipients_count: 1,
        already_requested: false,
      });

      const [createdPermission] = await db
        .select()
        .from(presentationPermissions)
        .where(
          and(
            eq(presentationPermissions.adminId, admin.id),
            eq(presentationPermissions.classId, testClass.id)
          )
        );
      track('presentationPermissions', createdPermission);
      expect(createdPermission).toMatchObject({ granted: false, permissionRequested: true });

      const messageRows = await db
        .select()
        .from(messages)
        .where(and(eq(messages.fromUserId, admin.id), eq(messages.toUserId, admin.id)));
      messageRows.forEach((row) => track('messages', row));
      expect(messageRows).toHaveLength(1);
      expect(messageRows[0].subject).toBe('[SYSTEM LOG] Permission Request');
    });
  });
});
