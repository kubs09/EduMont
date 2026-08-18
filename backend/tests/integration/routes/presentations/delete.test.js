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

describe('DELETE /api/presentations/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/presentations/1');

    expect(res.status).toBe(401);
  });

  test('400 for a non-numeric id', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete('/api/presentations/abc')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid presentation ID' });
  });

  test('404 for an unknown presentation id', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete('/api/presentations/999999999')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(404);
  });

  test("403 when a teacher who doesn't teach the child's class tries to delete, though they can delete for a child in their own class", async () => {
    const teacher = track('users', await createTestUser('teacher'));

    // Give the teacher SOME legitimate access elsewhere, so a 403 on the
    // out-of-scope presentation below is provably about that specific
    // child's class rather than the teacher having no access to anything.
    const ownClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(ownClass.id, teacher.id));
    const ownChild = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(ownChild.id, ownClass.id));
    const ownPresentation = track(
      'presentations',
      await createTestPresentation(ownChild.id, ownClass.id)
    );

    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));
    const presentation = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id)
    );

    const res = await request(app)
      .delete(`/api/presentations/${presentation.id}`)
      .set('Authorization', authHeader(teacher));

    expect(res.status).toBe(403);

    const [stillThere] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, presentation.id));
    expect(stillThere).toBeDefined();

    // Proves the 403 above is a targeted denial, not the teacher having no
    // delete access at all: the same teacher can delete a presentation for
    // a child in the class they actually teach.
    const ownRes = await request(app)
      .delete(`/api/presentations/${ownPresentation.id}`)
      .set('Authorization', authHeader(teacher));
    expect(ownRes.status).toBe(200);
  });

  test('deleting a middle presentation renumbers the remaining ones contiguously, leaving statuses untouched', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));
    const category = 'Practical Life';
    const p1 = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, {
        category,
        displayOrder: 1,
        status: 'mastered',
      })
    );
    const p2 = await createTestPresentation(child.id, testClass.id, {
      category,
      displayOrder: 2,
      status: 'to be presented',
    });
    const p3 = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, {
        category,
        displayOrder: 3,
        status: 'prerequisites not met',
      })
    );

    const res = await request(app)
      .delete(`/api/presentations/${p2.id}`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'presentation entry deleted successfully' });

    const remaining = await db
      .select({
        id: presentations.id,
        displayOrder: presentations.displayOrder,
        status: presentations.status,
      })
      .from(presentations)
      .where(and(eq(presentations.childId, child.id), eq(presentations.category, category)))
      .orderBy(asc(presentations.displayOrder), asc(presentations.id));

    // delete.js only calls normalizeDisplayOrder, never normalizeCategoryOrdering,
    // so display_order becomes contiguous (1, 2) but each row's status is left
    // exactly as it was before the delete.
    expect(remaining).toEqual([
      { id: p1.id, displayOrder: 1, status: 'mastered' },
      { id: p3.id, displayOrder: 2, status: 'prerequisites not met' },
    ]);
  });

  test('404 for a large numeric-but-nonexistent id, proving id-format validation and the not-found check are independent guards', async () => {
    // Documents that the fixed id-format check (Task 2) and the pre-existing
    // 404-for-missing-row check are two independent guards.
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete('/api/presentations/999999998')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(404);
  });
});
