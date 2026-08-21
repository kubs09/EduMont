import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
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
const { classes, classTeachers, classChildren } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('DELETE /api/classes/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/classes/1');

    expect(res.status).toBe(401);
  });

  test('403 for non-admin', async () => {
    const teacher = track('users', await createTestUser('teacher'));

    const res = await request(app)
      .delete('/api/classes/1')
      .set('Authorization', authHeader(teacher));

    expect(res.status).toBe(403);
  });

  test('400 for a non-integer/non-positive :id', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app).delete('/api/classes/0').set('Authorization', authHeader(admin));

    expect(res.status).toBe(400);
  });

  test('200 on success, cascading classTeachers and classChildren cleanup', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const child = track('children', await createTestChild());
    const testClass = track('classes', await createTestClass());
    await linkTeacher(testClass.id, teacher.id);
    await linkChildToClass(child.id, testClass.id);

    const res = await request(app)
      .delete(`/api/classes/${testClass.id}`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Class deleted successfully' });

    const [remainingClass] = await db.select().from(classes).where(eq(classes.id, testClass.id));
    expect(remainingClass).toBeUndefined();

    const remainingTeacherLinks = await db
      .select()
      .from(classTeachers)
      .where(eq(classTeachers.classId, testClass.id));
    expect(remainingTeacherLinks).toHaveLength(0);

    const remainingChildLinks = await db
      .select()
      .from(classChildren)
      .where(eq(classChildren.classId, testClass.id));
    expect(remainingChildLinks).toHaveLength(0);
  });

  test('200 for an unknown class id too, since the route has no existence check', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete('/api/classes/999999999')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Class deleted successfully' });
  });
});
