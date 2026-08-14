import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, asc, eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
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
const { default: pool, db } = await import('#backend/config/database.js');
const { presentations } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('PUT /api/presentations/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .put('/api/presentations/1')
      .send({ child_id: 1, class_id: 1, name: 'Pouring' });

    expect(res.status).toBe(401);
  });

  test('400 for a non-numeric id', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .put('/api/presentations/abc')
      .set('Authorization', authHeader(admin))
      .send({ child_id: 1, class_id: 1, name: 'Pouring' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid presentation ID' });
  });

  test('404 for an unknown presentation id', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));

    const res = await request(app)
      .put('/api/presentations/999999999')
      .set('Authorization', authHeader(admin))
      .send({ child_id: child.id, class_id: testClass.id, name: 'Pouring' });

    expect(res.status).toBe(404);
  });

  test("403 when a teacher who doesn't teach the new child's class tries to edit", async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(testClass.id, teacher.id));
    const ownChild = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(ownChild.id, testClass.id));
    const presentation = track(
      'presentations',
      await createTestPresentation(ownChild.id, testClass.id)
    );
    const otherChild = track('children', await createTestChild());

    const res = await request(app)
      .put(`/api/presentations/${presentation.id}`)
      .set('Authorization', authHeader(teacher))
      .send({ child_id: otherChild.id, class_id: testClass.id, name: 'Renamed' });

    expect(res.status).toBe(403);
  });

  test('editing a presentation into a different category re-normalizes both the new and previous child+category groups', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));

    const pa1 = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, {
        category: 'Category A',
        displayOrder: 1,
        status: 'to be presented',
      })
    );
    const pa2 = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, {
        category: 'Category A',
        displayOrder: 2,
        status: 'prerequisites not met',
      })
    );
    const pb1 = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, {
        category: 'Category B',
        displayOrder: 1,
        status: 'mastered',
      })
    );
    const pb2 = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, {
        category: 'Category B',
        displayOrder: 2,
        status: 'prerequisites not met',
      })
    );

    // Move pa1 out of Category A and into Category B, placed after pb2.
    const res = await request(app)
      .put(`/api/presentations/${pa1.id}`)
      .set('Authorization', authHeader(admin))
      .send({
        child_id: child.id,
        class_id: testClass.id,
        name: pa1.name,
        category: 'Category B',
        display_order: 3,
        status: 'prerequisites not met',
      });

    expect(res.status).toBe(200);

    const categoryARows = await db
      .select({ id: presentations.id, status: presentations.status })
      .from(presentations)
      .where(and(eq(presentations.childId, child.id), eq(presentations.category, 'Category A')))
      .orderBy(asc(presentations.displayOrder), asc(presentations.id));
    // pa1 left Category A, so pa2 (the only row left) becomes the newly
    // promoted "to be presented" one.
    expect(categoryARows).toEqual([{ id: pa2.id, status: 'to be presented' }]);

    const categoryBRows = await db
      .select({ id: presentations.id, status: presentations.status })
      .from(presentations)
      .where(and(eq(presentations.childId, child.id), eq(presentations.category, 'Category B')))
      .orderBy(asc(presentations.displayOrder), asc(presentations.id));
    // pb1 (mastered) is untouched; pb2 is promoted to "to be presented" since it's
    // now the earliest un-presented row; pa1 (now in Category B, after pb2) is
    // demoted to "prerequisites not met".
    expect(categoryBRows).toEqual([
      { id: pb1.id, status: 'mastered' },
      { id: pb2.id, status: 'to be presented' },
      { id: pa1.id, status: 'prerequisites not met' },
    ]);
  });

  test('returns 400, not 500, for a class the child is not assigned to', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());
    const otherClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));
    const presentation = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id)
    );

    const res = await request(app)
      .put(`/api/presentations/${presentation.id}`)
      .set('Authorization', authHeader(admin))
      .send({ child_id: child.id, class_id: otherClass.id, name: 'Renamed' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
  });
});
