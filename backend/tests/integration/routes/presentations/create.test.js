import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, asc, eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
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
const { presentations, categoryPresentations } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('POST /api/presentations (integration)', () => {
  const { track, cleanup } = createCleanupTracker();
  const createdCategoryPresentationIds = [];

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
    for (const id of createdCategoryPresentationIds.splice(0)) {
      await db.delete(categoryPresentations).where(eq(categoryPresentations.id, id));
    }
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .send({ child_id: 1, class_id: 1, name: 'Pouring' });

    expect(res.status).toBe(401);
  });

  test('201 on success, persisting the row', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader(admin))
      .send({ child_id: child.id, class_id: testClass.id, name: 'Pouring Exercise' });

    expect(res.status).toBe(201);
    track('presentations', res.body);

    const [persisted] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, res.body.id));
    expect(persisted).toMatchObject({
      childId: child.id,
      classId: testClass.id,
      name: 'Pouring Exercise',
    });
  });

  test('400 when the child is not assigned to the class', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader(admin))
      .send({ child_id: child.id, class_id: testClass.id, name: 'Pouring Exercise' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
  });

  test("403 when a teacher who doesn't teach the child's class tries to create", async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader(teacher))
      .send({ child_id: child.id, class_id: testClass.id, name: 'Pouring Exercise' });

    expect(res.status).toBe(403);
  });

  test('defaults display_order from a seeded category_presentations row when omitted', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass({ minAge: 2, maxAge: 6 }));
    const child = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(child.id, testClass.id));
    const [template] = await db
      .insert(categoryPresentations)
      .values({
        category: 'Practical Life',
        name: 'Practical Life Template',
        ageGroup: testClass.ageGroup,
        displayOrder: 7,
      })
      .returning();
    createdCategoryPresentationIds.push(template.id);

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader(admin))
      .send({
        child_id: child.id,
        class_id: testClass.id,
        name: 'Pouring Exercise',
        category: 'Practical Life',
      });

    expect(res.status).toBe(201);
    track('presentations', res.body);
    expect(res.body.displayOrder).toBe(7);
  });

  test('creating a presentation that becomes the earliest un-presented one re-flags the previous "to be presented" row via normalizeCategoryOrdering', async () => {
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
    const p2 = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, {
        category,
        displayOrder: 2,
        status: 'to be presented',
      })
    );
    const p3 = track(
      'presentations',
      await createTestPresentation(child.id, testClass.id, {
        category,
        displayOrder: 3,
        status: 'prerequisites not met',
      })
    );

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader(admin))
      .send({
        child_id: child.id,
        class_id: testClass.id,
        name: 'New Practical Life Task',
        category,
        display_order: 1,
      });

    expect(res.status).toBe(201);
    track('presentations', res.body);

    const rows = await db
      .select({ id: presentations.id, status: presentations.status })
      .from(presentations)
      .where(and(eq(presentations.childId, child.id), eq(presentations.category, category)))
      .orderBy(asc(presentations.displayOrder), asc(presentations.id));

    // Order: p1 (displayOrder 1, created first) ties on displayOrder with the new
    // row but sorts first by id; the new row lands right after it.
    expect(rows).toEqual([
      { id: p1.id, status: 'mastered' },
      { id: res.body.id, status: 'to be presented' },
      { id: p2.id, status: 'prerequisites not met' },
      { id: p3.id, status: 'prerequisites not met' },
    ]);
  });

  test('returns 400, not 500, for a non-existent class_id (FK violation never reached — caught by the classChildren pre-check)', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());

    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', authHeader(admin))
      .send({ child_id: child.id, class_id: 999999999, name: 'Pouring Exercise' });

    expect(res.status).toBe(400);
    // No class_id 999999999 means classChildren has no matching row either,
    // so this is the documented 400 branch, not a 500 — kept here to record
    // that this input does not reach the insert at all.
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
  });
});
