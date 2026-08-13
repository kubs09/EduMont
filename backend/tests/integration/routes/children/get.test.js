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
  grantPresentationPermission,
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

describe('children routes: GET (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/children');

    expect(res.status).toBe(401);
  });

  describe('GET /api/children', () => {
    test('admin sees all children, parent and teacher see only their own', async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));
      const otherParent = track('users', await createTestUser('parent'));
      const teacher = track('users', await createTestUser('teacher'));
      const classA = track('classes', await createTestClass());
      const classB = track('classes', await createTestClass());
      const childA = track('children', await createTestChild());
      const childB = track('children', await createTestChild());
      track('childParents', await linkParent(childA.id, parent.id));
      track('childParents', await linkParent(childB.id, otherParent.id));
      track('classChildren', await linkChildToClass(childA.id, classA.id));
      track('classChildren', await linkChildToClass(childB.id, classB.id));
      track('classTeachers', await linkTeacher(classA.id, teacher.id));

      const adminRes = await request(app).get('/api/children').set('Authorization', authHeader(admin));
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.map((c) => c.id)).toEqual(expect.arrayContaining([childA.id, childB.id]));

      const parentRes = await request(app).get('/api/children').set('Authorization', authHeader(parent));
      expect(parentRes.status).toBe(200);
      const parentIds = parentRes.body.map((c) => c.id);
      expect(parentIds).toContain(childA.id);
      expect(parentIds).not.toContain(childB.id);

      const teacherRes = await request(app).get('/api/children').set('Authorization', authHeader(teacher));
      expect(teacherRes.status).toBe(200);
      const teacherIds = teacherRes.body.map((c) => c.id);
      expect(teacherIds).toContain(childA.id);
      expect(teacherIds).not.toContain(childB.id);
    });
  });

  describe('GET /api/children/:id', () => {
    test('404 for an unknown id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/children/999999999')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(404);
    });

    test('403 when a parent requests a child that is not theirs', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .get(`/api/children/${child.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 with child data otherwise', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild({ dateOfBirth: '2019-05-01' }));
      track('childParents', await linkParent(child.id, parent.id));

      const res = await request(app)
        .get(`/api/children/${child.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: child.id,
        firstname: child.firstname,
        surname: child.surname,
      });
    });
  });

  describe('GET /api/children/:id/classes', () => {
    test('200 with the class list', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/classes`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: testClass.id, name: testClass.name })]);
    });
  });

  describe('GET /api/children/:id/presentations', () => {
    test('404 when the child has no class', async () => {
      const admin = track('users', await createTestUser('admin'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .get(`/api/children/${child.id}/presentations`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(404);
    });

    test('403 for an admin without a granted permission', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/presentations`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(403);
    });

    test('403 for a teacher not assigned to the class', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/presentations`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(403);
    });

    test('403 for a parent not linked to the child', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/presentations`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 for an authorized admin', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('presentationPermissions', await grantPresentationPermission(admin.id, testClass.id, true));
      const presentation = track('presentations', await createTestPresentation(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/presentations`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: presentation.id, name: presentation.name })]);
    });

    test('200 for an authorized teacher', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const presentation = track('presentations', await createTestPresentation(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/presentations`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: presentation.id, name: presentation.name })]);
    });

    test('200 for an authorized parent', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('childParents', await linkParent(child.id, parent.id));
      const presentation = track('presentations', await createTestPresentation(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/presentations`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: presentation.id, name: presentation.name })]);
    });
  });
});
