import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { classTeachers } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const validBody = () => ({ name: 'Sunflowers', description: 'A class', min_age: 2, max_age: 6 });

describe('PUT /api/classes/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).put('/api/classes/1').send(validBody());

    expect(res.status).toBe(401);
  });

  test('403 for non-admin', async () => {
    const teacher = track('users', await createTestUser('teacher'));

    const res = await request(app)
      .put('/api/classes/1')
      .set('Authorization', authHeader(teacher))
      .send(validBody());

    expect(res.status).toBe(403);
  });

  test('400 for an invalid :id', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .put('/api/classes/0')
      .set('Authorization', authHeader(admin))
      .send({ ...validBody(), teacherId: 1 });

    expect(res.status).toBe(400);
  });

  test('400 for a missing teacherId', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());

    const res = await request(app)
      .put(`/api/classes/${testClass.id}`)
      .set('Authorization', authHeader(admin))
      .send(validBody());

    expect(res.status).toBe(400);
  });

  test('404 for an unknown class id', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));

    const res = await request(app)
      .put('/api/classes/999999999')
      .set('Authorization', authHeader(admin))
      .send({ ...validBody(), teacherId: teacher.id });

    expect(res.status).toBe(404);
  });

  test('400 when the new teacher is already assigned to a different class', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const otherClass = track('classes', await createTestClass());
    const targetClass = track('classes', await createTestClass());
    track('classTeachers', { classId: otherClass.id, teacherId: teacher.id });
    await db
      .insert(classTeachers)
      .values({ classId: otherClass.id, teacherId: teacher.id, role: 'teacher' });

    const res = await request(app)
      .put(`/api/classes/${targetClass.id}`)
      .set('Authorization', authHeader(admin))
      .send({ ...validBody(), teacherId: teacher.id });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('teacher is already assigned'),
    });
  });

  test('400 when the new assistant is already assigned to a different class', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const assistant = track('users', await createTestUser('teacher'));
    const otherClass = track('classes', await createTestClass());
    const targetClass = track('classes', await createTestClass());
    track('classTeachers', { classId: otherClass.id, teacherId: assistant.id });
    await db
      .insert(classTeachers)
      .values({ classId: otherClass.id, teacherId: assistant.id, role: 'teacher' });

    const res = await request(app)
      .put(`/api/classes/${targetClass.id}`)
      .set('Authorization', authHeader(admin))
      .send({ ...validBody(), teacherId: teacher.id, assistantId: assistant.id });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('assistant is already assigned'),
    });
  });

  test('swaps the teacher, replacing classTeachers rows and setting permission_requested', async () => {
    const admin = track('users', await createTestUser('admin'));
    const oldTeacher = track('users', await createTestUser('teacher'));
    const newTeacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    track('classTeachers', { classId: testClass.id, teacherId: oldTeacher.id });
    await db
      .insert(classTeachers)
      .values({ classId: testClass.id, teacherId: oldTeacher.id, role: 'teacher' });

    const res = await request(app)
      .put(`/api/classes/${testClass.id}`)
      .set('Authorization', authHeader(admin))
      .send({ ...validBody(), teacherId: newTeacher.id });

    expect(res.status).toBe(200);
    track('classTeachers', { classId: testClass.id, teacherId: newTeacher.id });

    const links = await db
      .select()
      .from(classTeachers)
      .where(eq(classTeachers.classId, testClass.id));
    expect(links).toEqual([
      expect.objectContaining({
        teacherId: newTeacher.id,
        role: 'teacher',
        permissionRequested: true,
      }),
    ]);
  });

  test('leaves permission_requested false when resubmitting the same teacher', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    track('classTeachers', { classId: testClass.id, teacherId: teacher.id });
    await db
      .insert(classTeachers)
      .values({ classId: testClass.id, teacherId: teacher.id, role: 'teacher' });

    const res = await request(app)
      .put(`/api/classes/${testClass.id}`)
      .set('Authorization', authHeader(admin))
      .send({ ...validBody(), teacherId: teacher.id });

    expect(res.status).toBe(200);

    const [link] = await db
      .select()
      .from(classTeachers)
      .where(eq(classTeachers.classId, testClass.id));
    expect(link).toMatchObject({ teacherId: teacher.id, permissionRequested: false });
  });
});
