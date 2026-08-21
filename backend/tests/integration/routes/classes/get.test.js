import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  createTestPresentation,
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

describe('classes routes: GET (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/classes');

    expect(res.status).toBe(401);
  });

  describe('GET /api/classes', () => {
    test('admin and teacher see classes, parent sees only classes with their own child', async () => {
      const admin = track('users', await createTestUser('admin'));
      const teacher = track('users', await createTestUser('teacher'));
      const parent = track('users', await createTestUser('parent'));
      const classA = track('classes', await createTestClass());
      const classB = track('classes', await createTestClass());
      const childA = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(childA.id, classA.id));
      track('childParents', await linkParent(childA.id, parent.id));
      track('classTeachers', await linkTeacher(classA.id, teacher.id));

      const adminRes = await request(app)
        .get('/api/classes')
        .set('Authorization', authHeader(admin));
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.map((c) => c.id)).toEqual(
        expect.arrayContaining([classA.id, classB.id])
      );

      const teacherRes = await request(app)
        .get('/api/classes')
        .set('Authorization', authHeader(teacher));
      expect(teacherRes.status).toBe(200);
      const teacherIds = teacherRes.body.map((c) => c.id);
      expect(teacherIds).toContain(classA.id);
      expect(teacherIds).not.toContain(classB.id);

      const parentRes = await request(app)
        .get('/api/classes')
        .set('Authorization', authHeader(parent));
      expect(parentRes.status).toBe(200);
      const parentIds = parentRes.body.map((c) => c.id);
      expect(parentIds).toContain(classA.id);
      expect(parentIds).not.toContain(classB.id);
    });
  });

  describe('GET /api/classes/:id', () => {
    test('404 when the class row does not exist', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/classes/999999999')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(404);
    });

    test('403 for a parent with no child in the class', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get(`/api/classes/${testClass.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 for a parent with a child in the class', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/classes/${testClass.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: testClass.id, name: testClass.name });
    });

    test('200 for a teacher', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));

      const res = await request(app)
        .get(`/api/classes/${testClass.id}`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: testClass.id, name: testClass.name });
    });

    test('200 for an admin', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get(`/api/classes/${testClass.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: testClass.id, name: testClass.name });
    });
  });

  describe('GET /api/classes/:id/next-presentations', () => {
    test('403 for a parent with no child in the class', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get(`/api/classes/${testClass.id}/next-presentations`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 with the presentation list for a parent with a child in the class', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, { status: 'to be presented' })
      );

      const res = await request(app)
        .get(`/api/classes/${testClass.id}/next-presentations`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({ id: presentation.id, name: presentation.name }),
      ]);
    });

    test('200 with the presentation list for a teacher', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, { status: 'to be presented' })
      );

      const res = await request(app)
        .get(`/api/classes/${testClass.id}/next-presentations`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({ id: presentation.id, name: presentation.name }),
      ]);
    });

    test('200 with the presentation list for an admin', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, { status: 'to be presented' })
      );

      const res = await request(app)
        .get(`/api/classes/${testClass.id}/next-presentations`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({ id: presentation.id, name: presentation.name }),
      ]);
    });
  });

  describe('GET /api/classes/by-age/:age', () => {
    test('400 for a non-numeric age', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/classes/by-age/abc')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('400 for a negative age', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/classes/by-age/-1')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('200 with the matching classes otherwise', async () => {
      const admin = track('users', await createTestUser('admin'));
      const matchingClass = track('classes', await createTestClass({ minAge: 2, maxAge: 6 }));
      track('classes', await createTestClass({ minAge: 10, maxAge: 15 }));

      const res = await request(app)
        .get('/api/classes/by-age/4')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      const ids = res.body.map((c) => c.id);
      expect(ids).toContain(matchingClass.id);
    });
  });
});
