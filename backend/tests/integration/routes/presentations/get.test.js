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
  createTestPresentation,
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

describe('presentations routes: GET (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/presentations');

    expect(res.status).toBe(401);
  });

  describe('GET /api/presentations', () => {
    test('403 for a parent', async () => {
      const parent = track('users', await createTestUser('parent'));

      const res = await request(app)
        .get('/api/presentations')
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('teacher results are scoped to the classes they teach', async () => {
      const teacherA = track('users', await createTestUser('teacher'));
      const teacherB = track('users', await createTestUser('teacher'));
      const classA = track('classes', await createTestClass());
      const classB = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(classA.id, teacherA.id));
      track('classTeachers', await linkTeacher(classB.id, teacherB.id));
      const childA = track('children', await createTestChild());
      const childB = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(childA.id, classA.id));
      track('classChildren', await linkChildToClass(childB.id, classB.id));
      const presA = track('presentations', await createTestPresentation(childA.id, classA.id));
      track('presentations', await createTestPresentation(childB.id, classB.id));

      const res = await request(app)
        .get('/api/presentations')
        .set('Authorization', authHeader(teacherA));

      expect(res.status).toBe(200);
      const ids = res.body.map((p) => p.id);
      expect(ids).toContain(presA.id);
      expect(ids).toHaveLength(1);
    });

    test('200 filtered by status', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const mastered = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, { status: 'mastered' })
      );
      track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, { status: 'prerequisites not met' })
      );

      const res = await request(app)
        .get('/api/presentations')
        .query({ status: 'mastered' })
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body.map((p) => p.id)).toEqual([mastered.id]);
    });
  });

  describe('GET /api/presentations/child/:childId', () => {
    test('400 for an invalid childId', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/presentations/child/not-a-number')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('403 for a parent (canAccessChildpresentation never grants parents access)', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/presentations/child/${child.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 for an admin, filterable by status', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id)
      );

      const unfilteredRes = await request(app)
        .get(`/api/presentations/child/${child.id}`)
        .set('Authorization', authHeader(admin));
      expect(unfilteredRes.status).toBe(200);
      expect(unfilteredRes.body.map((p) => p.id)).toEqual([presentation.id]);

      const filteredRes = await request(app)
        .get(`/api/presentations/child/${child.id}`)
        .query({ status: 'mastered' })
        .set('Authorization', authHeader(admin));
      expect(filteredRes.status).toBe(200);
      expect(filteredRes.body).toEqual([]);
    });
  });

  describe('GET /api/presentations/class/:classId', () => {
    test('400 for an invalid classId', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/presentations/class/not-a-number')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('403 for a teacher not teaching the class', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get(`/api/presentations/class/${testClass.id}`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(403);
    });

    test('403 for a parent with no child in the class', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get(`/api/presentations/class/${testClass.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 for an admin', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id)
      );

      const res = await request(app)
        .get(`/api/presentations/class/${testClass.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body.map((p) => p.id)).toEqual([presentation.id]);
    });

    test('200 for the teacher of the class', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id)
      );

      const res = await request(app)
        .get(`/api/presentations/class/${testClass.id}`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
      expect(res.body.map((p) => p.id)).toEqual([presentation.id]);
    });

    test('200 for a parent with a child in the class, scoped to their own children', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const ownChild = track('children', await createTestChild());
      const otherChild = track('children', await createTestChild());
      track('childParents', await linkParent(ownChild.id, parent.id));
      track('classChildren', await linkChildToClass(ownChild.id, testClass.id));
      // otherChild is enrolled in the SAME class as ownChild but has no childParents link to
      // parent, so its presentation must be excluded by the route's exists(childParents...)
      // filter — this proves the filter actually scopes results, not just the class-id match.
      track('classChildren', await linkChildToClass(otherChild.id, testClass.id));
      const ownPresentation = track(
        'presentations',
        await createTestPresentation(ownChild.id, testClass.id)
      );
      track('presentations', await createTestPresentation(otherChild.id, testClass.id));

      const res = await request(app)
        .get(`/api/presentations/class/${testClass.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body.map((p) => p.id)).toEqual([ownPresentation.id]);
    });
  });
});
