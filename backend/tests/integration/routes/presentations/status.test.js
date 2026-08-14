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

describe('presentations status/reorder routes (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('PUT /api/presentations/children/:childId/:presentationId/status', () => {
    test('401 without a token', async () => {
      const res = await request(app)
        .put('/api/presentations/children/1/1/status')
        .send({ status: 'mastered' });

      expect(res.status).toBe(401);
    });

    test('404 when the presentation does not belong to this child', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const childA = track('children', await createTestChild());
      const childB = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(childA.id, testClass.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(childA.id, testClass.id)
      );

      const res = await request(app)
        .put(`/api/presentations/children/${childB.id}/${presentation.id}/status`)
        .set('Authorization', authHeader(admin))
        .send({ status: 'mastered' });

      expect(res.status).toBe(404);
    });

    test('setting a later presentation to mastered while an earlier one is still unpresented is overridden back by real renormalization', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const category = 'Practical Life';
      track(
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
        .put(`/api/presentations/children/${child.id}/${p3.id}/status`)
        .set('Authorization', authHeader(admin))
        .send({ status: 'mastered' });

      // The route's own response reflects the value it just set, before
      // normalizeCategoryOrdering runs afterwards in the same transaction.
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('mastered');

      const [persistedP2, persistedP3] = await Promise.all([
        db.select({ status: presentations.status }).from(presentations).where(eq(presentations.id, p2.id)),
        db.select({ status: presentations.status }).from(presentations).where(eq(presentations.id, p3.id)),
      ]);
      // p2 is still the earliest un-presented row in the category, so it stays
      // "to be presented"; p3 gets demoted back down since it comes after p2.
      expect(persistedP2[0].status).toBe('to be presented');
      expect(persistedP3[0].status).toBe('prerequisites not met');
    });

    test("403 when a teacher who doesn't teach the child's class tries to change status, though they can update status for a child in their own class", async () => {
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
        await createTestPresentation(ownChild.id, ownClass.id, {
          status: 'prerequisites not met',
        })
      );

      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, {
          status: 'prerequisites not met',
        })
      );

      const res = await request(app)
        .put(`/api/presentations/children/${child.id}/${presentation.id}/status`)
        .set('Authorization', authHeader(teacher))
        .send({ status: 'mastered' });

      expect(res.status).toBe(403);

      const [stillUnchanged] = await db
        .select({ status: presentations.status })
        .from(presentations)
        .where(eq(presentations.id, presentation.id));
      expect(stillUnchanged.status).toBe('prerequisites not met');

      // Proves the 403 above is a targeted denial, not the teacher having no
      // status-update access at all: the same teacher can update the status
      // of a presentation for a child in the class they actually teach.
      const ownRes = await request(app)
        .put(`/api/presentations/children/${ownChild.id}/${ownPresentation.id}/status`)
        .set('Authorization', authHeader(teacher))
        .send({ status: 'mastered' });
      expect(ownRes.status).toBe(200);
    });
  });

  describe('PUT /api/presentations/children/:childId/:presentationId/reorder', () => {
    test('401 without a token', async () => {
      const res = await request(app)
        .put('/api/presentations/children/1/1/reorder')
        .send({ direction: 'up' });

      expect(res.status).toBe(401);
    });

    test('swaps display_order with the adjacent sibling', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const category = 'Practical Life';
      const p1 = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, { category, displayOrder: 1 })
      );
      const p2 = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, { category, displayOrder: 2 })
      );

      const res = await request(app)
        .put(`/api/presentations/children/${child.id}/${p2.id}/reorder`)
        .set('Authorization', authHeader(admin))
        .send({ direction: 'up' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Presentation moved up' });

      const rows = await db
        .select({ id: presentations.id, displayOrder: presentations.displayOrder })
        .from(presentations)
        .where(and(eq(presentations.childId, child.id), eq(presentations.category, category)))
        .orderBy(asc(presentations.id));
      expect(rows).toEqual([
        { id: p1.id, displayOrder: 2 },
        { id: p2.id, displayOrder: 1 },
      ]);
    });

    test('400 "already at the top" when there is no earlier sibling in the category', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const onlyRow = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, {
          category: 'Practical Life',
          displayOrder: 1,
        })
      );

      const res = await request(app)
        .put(`/api/presentations/children/${child.id}/${onlyRow.id}/reorder`)
        .set('Authorization', authHeader(admin))
        .send({ direction: 'up' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Cannot move up: already at the top' });
    });

    test('400 "already at the bottom" when there is no later sibling in the category', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const onlyRow = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, {
          category: 'Practical Life',
          displayOrder: 1,
        })
      );

      const res = await request(app)
        .put(`/api/presentations/children/${child.id}/${onlyRow.id}/reorder`)
        .set('Authorization', authHeader(admin))
        .send({ direction: 'down' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Cannot move down: already at the bottom' });
    });

    test("403 when a teacher who doesn't teach the child's class tries to reorder, though they can reorder for a child in their own class", async () => {
      const teacher = track('users', await createTestUser('teacher'));

      // Give the teacher SOME legitimate access elsewhere, so a 403 on the
      // out-of-scope presentation below is provably about that specific
      // child's class rather than the teacher having no access to anything.
      const ownClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(ownClass.id, teacher.id));
      const ownChild = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(ownChild.id, ownClass.id));
      const category = 'Practical Life';
      const ownP1 = track(
        'presentations',
        await createTestPresentation(ownChild.id, ownClass.id, { category, displayOrder: 1 })
      );
      const ownP2 = track(
        'presentations',
        await createTestPresentation(ownChild.id, ownClass.id, { category, displayOrder: 2 })
      );

      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      const presentation = track(
        'presentations',
        await createTestPresentation(child.id, testClass.id, { category, displayOrder: 1 })
      );

      const res = await request(app)
        .put(`/api/presentations/children/${child.id}/${presentation.id}/reorder`)
        .set('Authorization', authHeader(teacher))
        .send({ direction: 'up' });

      expect(res.status).toBe(403);

      const [stillUnchanged] = await db
        .select({ displayOrder: presentations.displayOrder })
        .from(presentations)
        .where(eq(presentations.id, presentation.id));
      expect(stillUnchanged.displayOrder).toBe(1);

      // Proves the 403 above is a targeted denial, not the teacher having no
      // reorder access at all: the same teacher can reorder a presentation
      // for a child in the class they actually teach.
      const ownRes = await request(app)
        .put(`/api/presentations/children/${ownChild.id}/${ownP2.id}/reorder`)
        .set('Authorization', authHeader(teacher))
        .send({ direction: 'up' });
      expect(ownRes.status).toBe(200);

      const ownRows = await db
        .select({ id: presentations.id, displayOrder: presentations.displayOrder })
        .from(presentations)
        .where(and(eq(presentations.childId, ownChild.id), eq(presentations.category, category)))
        .orderBy(asc(presentations.id));
      expect(ownRows).toEqual([
        { id: ownP1.id, displayOrder: 2 },
        { id: ownP2.id, displayOrder: 1 },
      ]);
    });
  });
});
