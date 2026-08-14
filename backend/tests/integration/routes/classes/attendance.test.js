import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
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
const { classAttendance } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('classes routes: attendance (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/classes/1/attendance');

    expect(res.status).toBe(401);
  });

  describe('POST /api/classes/:id/attendance/check-in', () => {
    test('403 for a teacher not assigned to the class', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(teacher))
        .send({ child_id: child.id });

      expect(res.status).toBe(403);
    });

    test('403 for a parent not linked to the child', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(parent))
        .send({ child_id: child.id });

      expect(res.status).toBe(403);
    });

    test('404 when the child is not linked to the class', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id });

      expect(res.status).toBe(404);
    });

    test('201 creating a new attendance row, verified by re-querying classAttendance', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('classAttendance', { classId: testClass.id, childId: child.id });

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        classId: testClass.id,
        childId: child.id,
        attendanceDate: '2026-01-10',
        checkedInBy: admin.id,
      });

      const [persisted] = await db
        .select()
        .from(classAttendance)
        .where(and(eq(classAttendance.classId, testClass.id), eq(classAttendance.childId, child.id)));
      expect(persisted).toMatchObject({ checkedInBy: admin.id });
      expect(persisted.checkInAt).not.toBeNull();
    });

    test('409 when already checked in for that date (double check-in)', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('classAttendance', { classId: testClass.id, childId: child.id });

      const first = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });
      expect(first.status).toBe(201);

      const second = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });

      expect(second.status).toBe(409);
    });

    test('a second check-in on the same date hits the update path once the first is cleared', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('classAttendance', { classId: testClass.id, childId: child.id });

      const first = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });
      expect(first.status).toBe(201);

      await db
        .update(classAttendance)
        .set({ checkInAt: null })
        .where(eq(classAttendance.id, first.body.id));

      const second = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });

      expect(second.status).toBe(200);
      expect(second.body.id).toBe(first.body.id);
      expect(second.body.checkInAt).not.toBeNull();
    });
  });

  describe('POST /api/classes/:id/attendance/check-out', () => {
    test('403 for a teacher not assigned to the class', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-out`)
        .set('Authorization', authHeader(teacher))
        .send({ child_id: child.id });

      expect(res.status).toBe(403);
    });

    test('403 for a parent not linked to the child', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-out`)
        .set('Authorization', authHeader(parent))
        .send({ child_id: child.id });

      expect(res.status).toBe(403);
    });

    test('404 when the child is not linked to the class', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-out`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id });

      expect(res.status).toBe(404);
    });

    test('409 when not checked in yet for that date (check-out before check-in)', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-out`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });

      expect(res.status).toBe(409);
    });

    test('200 completing an existing check-in, verified by re-querying classAttendance', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('classAttendance', { classId: testClass.id, childId: child.id });

      const checkIn = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });
      expect(checkIn.status).toBe(201);

      const res = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-out`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(checkIn.body.id);
      expect(res.body.checkOutAt).not.toBeNull();

      const [persisted] = await db
        .select()
        .from(classAttendance)
        .where(and(eq(classAttendance.classId, testClass.id), eq(classAttendance.childId, child.id)));
      expect(persisted.checkOutAt).not.toBeNull();
      expect(persisted.checkedOutBy).toBe(admin.id);
    });

    test('409 when already checked out (double check-out)', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('classAttendance', { classId: testClass.id, childId: child.id });

      await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-in`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });

      const first = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-out`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post(`/api/classes/${testClass.id}/attendance/check-out`)
        .set('Authorization', authHeader(admin))
        .send({ child_id: child.id, attendance_date: '2026-01-10' });

      expect(second.status).toBe(409);
    });
  });
});
