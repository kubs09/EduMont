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

describe('GET /api/presentations/class/:id/next-presentations (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/presentations/class/1/next-presentations');

    expect(res.status).toBe(401);
  });

  test('403 for a teacher not teaching the class', async () => {
    const teacher = track('users', await createTestUser('teacher'));

    // Give the teacher SOME legitimate access elsewhere, so the 403 below is
    // provably about this teacher not teaching this specific class, rather
    // than the teacher having no class access at all.
    const ownClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(ownClass.id, teacher.id));

    const testClass = track('classes', await createTestClass());

    const res = await request(app)
      .get(`/api/presentations/class/${testClass.id}/next-presentations`)
      .set('Authorization', authHeader(teacher));

    expect(res.status).toBe(403);
  });

  test('200 empty array for a parent with no child in the class', async () => {
    const parent = track('users', await createTestUser('parent'));

    // Give the parent SOME legitimate access elsewhere, so the empty result
    // below is provably about this parent having no child in this specific
    // class, rather than the parent having no children at all.
    const ownClass = track('classes', await createTestClass());
    const ownChild = track('children', await createTestChild());
    track('childParents', await linkParent(ownChild.id, parent.id));
    track('classChildren', await linkChildToClass(ownChild.id, ownClass.id));
    track(
      'presentations',
      await createTestPresentation(ownChild.id, ownClass.id, { status: 'to be presented' })
    );

    const testClass = track('classes', await createTestClass());

    const res = await request(app)
      .get(`/api/presentations/class/${testClass.id}/next-presentations`)
      .set('Authorization', authHeader(parent));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('200 with only "to be presented" rows for an admin', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));
    const nextOne = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, { status: 'to be presented' })
    );
    track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, { status: 'prerequisites not met' })
    );

    const res = await request(app)
      .get(`/api/presentations/class/${testClass.id}/next-presentations`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([expect.objectContaining({ id: nextOne.id, name: nextOne.name })]);
  });

  test('200 for the teacher of the class', async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(testClass.id, teacher.id));
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));
    const nextOne = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, { status: 'to be presented' })
    );

    const res = await request(app)
      .get(`/api/presentations/class/${testClass.id}/next-presentations`)
      .set('Authorization', authHeader(teacher));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([expect.objectContaining({ id: nextOne.id, name: nextOne.name })]);
  });

  test('200 for a parent with a child in the class', async () => {
    const parent = track('users', await createTestUser('parent'));
    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('childParents', await linkParent(child.id, parent.id));
    track('classChildren', await linkChildToClass(child.id, testClass.id));
    const nextOne = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, { status: 'to be presented' })
    );

    const res = await request(app)
      .get(`/api/presentations/class/${testClass.id}/next-presentations`)
      .set('Authorization', authHeader(parent));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([expect.objectContaining({ id: nextOne.id, name: nextOne.name })]);
  });
});
