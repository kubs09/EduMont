import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
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
const { default: pool } = await import('#backend/config/database.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('GET /api/messages/users (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/messages/users');

    expect(res.status).toBe(401);
  });

  test('admin sees every other user, but not themselves', async () => {
    const admin = track('users', await createTestUser('admin'));
    const otherTeacher = track('users', await createTestUser('teacher'));
    const otherParent = track('users', await createTestUser('parent'));

    const res = await request(app)
      .get('/api/messages/users')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    const ids = res.body.map((u) => u.id);
    expect(ids).toEqual(expect.arrayContaining([otherTeacher.id, otherParent.id]));
    expect(ids).not.toContain(admin.id);
  });

  test("teacher sees all admins, all other teachers, and parents of children in the teacher's classes", async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(testClass.id, teacher.id));

    const admin = track('users', await createTestUser('admin'));

    const otherTeacher = track('users', await createTestUser('teacher'));
    const otherClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(otherClass.id, otherTeacher.id));

    const unlinkedTeacher = track('users', await createTestUser('teacher'));

    const linkedParent = track('users', await createTestUser('parent'));
    const linkedChild = track('children', await createTestChild());
    track('childParents', await linkParent(linkedChild.id, linkedParent.id));
    track('classChildren', await linkChildToClass(linkedChild.id, testClass.id));

    const unlinkedParent = track('users', await createTestUser('parent'));
    const unlinkedChild = track('children', await createTestChild());
    track('childParents', await linkParent(unlinkedChild.id, unlinkedParent.id));
    track('classChildren', await linkChildToClass(unlinkedChild.id, otherClass.id));

    const res = await request(app)
      .get('/api/messages/users')
      .set('Authorization', authHeader(teacher));

    expect(res.status).toBe(200);
    const ids = res.body.map((u) => u.id);
    expect(ids).toEqual(expect.arrayContaining([admin.id, otherTeacher.id, linkedParent.id]));
    expect(ids).not.toContain(teacher.id);
    expect(ids).not.toContain(unlinkedTeacher.id);
    expect(ids).not.toContain(unlinkedParent.id);
  });

  test("parent sees teachers of their children's classes", async () => {
    const parent = track('users', await createTestUser('parent'));
    const child = track('children', await createTestChild());
    track('childParents', await linkParent(child.id, parent.id));
    const testClass = track('classes', await createTestClass());
    track('classChildren', await linkChildToClass(child.id, testClass.id));

    const linkedTeacher = track('users', await createTestUser('teacher'));
    track('classTeachers', await linkTeacher(testClass.id, linkedTeacher.id));

    const unlinkedTeacher = track('users', await createTestUser('teacher'));
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .get('/api/messages/users')
      .set('Authorization', authHeader(parent));

    expect(res.status).toBe(200);
    const ids = res.body.map((u) => u.id);
    expect(ids).toEqual(expect.arrayContaining([linkedTeacher.id]));
    expect(ids).not.toContain(unlinkedTeacher.id);
    expect(ids).not.toContain(admin.id);
  });
});
