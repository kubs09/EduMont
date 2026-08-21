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
const { classes, classTeachers } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('POST /api/classes (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .post('/api/classes')
      .send({ name: 'Sunflowers', age_group: 'Toddler', min_age: 2, max_age: 6, teacherId: 1 });

    expect(res.status).toBe(401);
  });

  test('creates a class without an assistant', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader(admin))
      .send({
        name: 'Sunflowers',
        description: 'A class',
        age_group: 'Toddler',
        min_age: 2,
        max_age: 6,
        teacherId: teacher.id,
      });

    expect(res.status).toBe(201);
    track('classes', { id: res.body.id });
    track('classTeachers', { classId: res.body.id, teacherId: teacher.id });

    const teacherLinks = await db
      .select()
      .from(classTeachers)
      .where(eq(classTeachers.classId, res.body.id));
    expect(teacherLinks).toEqual([
      expect.objectContaining({ teacherId: teacher.id, role: 'teacher' }),
    ]);
  });

  test('creates a class with an assistant', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const assistant = track('users', await createTestUser('teacher'));

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader(admin))
      .send({
        name: 'Sunflowers',
        description: 'A class',
        age_group: 'Toddler',
        min_age: 2,
        max_age: 6,
        teacherId: teacher.id,
        assistantId: assistant.id,
      });

    expect(res.status).toBe(201);
    track('classes', { id: res.body.id });
    track('classTeachers', { classId: res.body.id, teacherId: teacher.id });
    track('classTeachers', { classId: res.body.id, teacherId: assistant.id });

    const links = await db
      .select()
      .from(classTeachers)
      .where(eq(classTeachers.classId, res.body.id));
    expect(links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ teacherId: teacher.id, role: 'teacher' }),
        expect.objectContaining({ teacherId: assistant.id, role: 'assistant' }),
      ])
    );
  });

  test('400 when the chosen teacher is already assigned to another class, without creating an orphan class row', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const existingClass = track('classes', await createTestClass());
    track('classTeachers', { classId: existingClass.id, teacherId: teacher.id });
    await db
      .insert(classTeachers)
      .values({ classId: existingClass.id, teacherId: teacher.id, role: 'teacher' });
    const uniqueName = `Orphan Check ${Date.now()}`;

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader(admin))
      .send({
        name: uniqueName,
        age_group: 'Toddler',
        min_age: 2,
        max_age: 6,
        teacherId: teacher.id,
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('teacher is already assigned'),
    });

    const orphans = await db.select().from(classes).where(eq(classes.name, uniqueName));
    expect(orphans).toHaveLength(0);
  });

  test('400 when the chosen assistant is already assigned to another class, without creating an orphan class row', async () => {
    const admin = track('users', await createTestUser('admin'));
    const teacher = track('users', await createTestUser('teacher'));
    const assistant = track('users', await createTestUser('teacher'));
    const existingClass = track('classes', await createTestClass());
    track('classTeachers', { classId: existingClass.id, teacherId: assistant.id });
    await db
      .insert(classTeachers)
      .values({ classId: existingClass.id, teacherId: assistant.id, role: 'teacher' });
    const uniqueName = `Orphan Check ${Date.now()}`;

    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', authHeader(admin))
      .send({
        name: uniqueName,
        age_group: 'Toddler',
        min_age: 2,
        max_age: 6,
        teacherId: teacher.id,
        assistantId: assistant.id,
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.stringContaining('assistant is already assigned'),
    });

    const orphans = await db.select().from(classes).where(eq(classes.name, uniqueName));
    expect(orphans).toHaveLength(0);
  });
});
