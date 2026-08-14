import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  createTestClassHistory,
  linkParent,
  linkTeacher,
  linkChildToClass,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { classHistory } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('classes routes: history (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/classes/1/history');

    expect(res.status).toBe(401);
  });

  describe('GET /api/classes/:id/history', () => {
    test('200 for admin', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const history = track('classHistory', await createTestClassHistory(testClass.id, admin.id));

      const res = await request(app)
        .get(`/api/classes/${testClass.id}/history`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: history.id, class_id: testClass.id })]);
    });

    test('200 for teacher', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const history = track('classHistory', await createTestClassHistory(testClass.id, teacher.id));

      const res = await request(app)
        .get(`/api/classes/${testClass.id}/history`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: history.id, class_id: testClass.id })]);
    });

    test('403 for a parent with no child in the class', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get(`/api/classes/${testClass.id}/history`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 for a parent with a child in the class', async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const history = track('classHistory', await createTestClassHistory(testClass.id, admin.id));

      const res = await request(app)
        .get(`/api/classes/${testClass.id}/history`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: history.id, class_id: testClass.id })]);
    });
  });

  describe('POST /api/classes/:id/history', () => {
    test('403 for parent', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/history`)
        .set('Authorization', authHeader(parent))
        .send({ date: '2026-01-10', notes: 'Note' });

      expect(res.status).toBe(403);
    });

    test('201 on success for admin, verified by re-querying', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/history`)
        .set('Authorization', authHeader(admin))
        .send({ date: '2026-01-10', notes: 'Admin note' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ classId: testClass.id, notes: 'Admin note', createdBy: admin.id });
      track('classHistory', res.body);

      const [persisted] = await db.select().from(classHistory).where(eq(classHistory.id, res.body.id));
      expect(persisted).toMatchObject({ classId: testClass.id, notes: 'Admin note', createdBy: admin.id });
    });

    test('201 on success for teacher, verified by re-querying', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/history`)
        .set('Authorization', authHeader(teacher))
        .send({ date: '2026-01-10', notes: 'Teacher note' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ classId: testClass.id, notes: 'Teacher note', createdBy: teacher.id });
      track('classHistory', res.body);

      const [persisted] = await db.select().from(classHistory).where(eq(classHistory.id, res.body.id));
      expect(persisted).toMatchObject({ classId: testClass.id, notes: 'Teacher note', createdBy: teacher.id });
    });
  });

  describe('DELETE /api/classes/:classId/history/:historyId', () => {
    test('403 for parent', async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const history = track('classHistory', await createTestClassHistory(testClass.id, admin.id));

      const res = await request(app)
        .delete(`/api/classes/${testClass.id}/history/${history.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);

      const [stillThere] = await db.select().from(classHistory).where(eq(classHistory.id, history.id));
      expect(stillThere).toBeDefined();
    });

    test('200 on success for admin, verified by re-querying', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const history = await createTestClassHistory(testClass.id, admin.id);

      const res = await request(app)
        .delete(`/api/classes/${testClass.id}/history/${history.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'History entry deleted successfully' });

      const remaining = await db.select().from(classHistory).where(eq(classHistory.id, history.id));
      expect(remaining).toHaveLength(0);
    });

    test('200 for a non-existent history id, since the route has no existence check', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .delete(`/api/classes/${testClass.id}/history/999999999`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'History entry deleted successfully' });
    });
  });
});
