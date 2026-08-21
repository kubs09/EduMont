import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  createTestExcuse,
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
const { default: pool, db } = await import('#backend/config/database.js');
const { childExcuses } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const validExcuse = {
  date_from: '2026-01-10',
  date_to: '2026-01-12',
  reason: 'Sick leave',
};

describe('children routes: excuses (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/children/1/excuses');

    expect(res.status).toBe(401);
  });

  describe('GET /api/children/:id/excuses', () => {
    test('400 for a non-integer child id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/children/not-a-number/excuses')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('403 for a parent not linked to the child', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .get(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test("403 for a teacher not assigned to the child's class", async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(403);
    });

    test('200 for admin, returning the joined excuse list', async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      const excuse = track('childExcuses', await createTestExcuse(child.id, parent.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({
          id: excuse.id,
          child_id: child.id,
          parent_id: parent.id,
          date_from: excuse.dateFrom,
          date_to: excuse.dateTo,
          reason: excuse.reason,
          parent_firstname: parent.firstname,
          parent_surname: parent.surname,
        }),
      ]);
    });

    test('200 for a linked parent, returning the joined excuse list', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      const excuse = track('childExcuses', await createTestExcuse(child.id, parent.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({
          id: excuse.id,
          child_id: child.id,
          parent_id: parent.id,
          parent_firstname: parent.firstname,
          parent_surname: parent.surname,
        }),
      ]);
    });

    test('200 for an assigned teacher, returning the joined excuse list', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const excuse = track('childExcuses', await createTestExcuse(child.id, parent.id));

      const res = await request(app)
        .get(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({
          id: excuse.id,
          child_id: child.id,
          parent_id: parent.id,
          parent_firstname: parent.firstname,
          parent_surname: parent.surname,
        }),
      ]);
    });
  });

  describe('POST /api/children/:id/excuses', () => {
    test('403 for a non-parent role (admin)', async () => {
      const admin = track('users', await createTestUser('admin'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(admin))
        .send(validExcuse);

      expect(res.status).toBe(403);
    });

    test('403 for a non-parent role (teacher)', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(teacher))
        .send(validExcuse);

      expect(res.status).toBe(403);
    });

    test('400 for a non-integer child id', async () => {
      const parent = track('users', await createTestUser('parent'));

      const res = await request(app)
        .post('/api/children/not-a-number/excuses')
        .set('Authorization', authHeader(parent))
        .send(validExcuse);

      expect(res.status).toBe(400);
    });

    test('400 for missing date_from', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_from: undefined });

      expect(res.status).toBe(400);
    });

    test('400 for a malformed date_from', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_from: '01-10-2026' });

      expect(res.status).toBe(400);
    });

    test('400 for missing date_to', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_to: undefined });

      expect(res.status).toBe(400);
    });

    test('400 for a malformed date_to', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_to: '2026/01/12' });

      expect(res.status).toBe(400);
    });

    test('400 when date_to is before date_from', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_from: '2026-01-12', date_to: '2026-01-10' });

      expect(res.status).toBe(400);
    });

    test('400 for missing reason', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, reason: undefined });

      expect(res.status).toBe(400);
    });

    test('400 for a reason over 1000 characters', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, reason: 'a'.repeat(1001) });

      expect(res.status).toBe(400);
    });

    test('403 for a parent not linked to the child', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send(validExcuse);

      expect(res.status).toBe(403);
    });

    test('201 with the created excuse on success', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));

      const res = await request(app)
        .post(`/api/children/${child.id}/excuses`)
        .set('Authorization', authHeader(parent))
        .send(validExcuse);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        childId: child.id,
        parentId: parent.id,
        dateFrom: validExcuse.date_from,
        dateTo: validExcuse.date_to,
        reason: validExcuse.reason,
      });
      track('childExcuses', res.body);

      const [persisted] = await db
        .select()
        .from(childExcuses)
        .where(eq(childExcuses.id, res.body.id));
      expect(persisted).toMatchObject({
        childId: child.id,
        parentId: parent.id,
        dateFrom: validExcuse.date_from,
        dateTo: validExcuse.date_to,
        reason: validExcuse.reason,
      });
    });
  });

  describe('PUT /api/children/:id/excuses/:excuseId', () => {
    test('403 for a non-parent role', async () => {
      const admin = track('users', await createTestUser('admin'));
      const child = track('children', await createTestChild());
      const parent = track('users', await createTestUser('parent'));
      const excuse = track('childExcuses', await createTestExcuse(child.id, parent.id));

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(admin))
        .send(validExcuse);

      expect(res.status).toBe(403);
    });

    test('400 for a non-integer child id', async () => {
      const parent = track('users', await createTestUser('parent'));

      const res = await request(app)
        .put('/api/children/not-a-number/excuses/1')
        .set('Authorization', authHeader(parent))
        .send(validExcuse);

      expect(res.status).toBe(400);
    });

    test('400 for a non-integer excuse id', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/not-a-number`)
        .set('Authorization', authHeader(parent))
        .send(validExcuse);

      expect(res.status).toBe(400);
    });

    test('400 for missing date_from', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_from: undefined });

      expect(res.status).toBe(400);
    });

    test('400 for a malformed date_from', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_from: '01-10-2026' });

      expect(res.status).toBe(400);
    });

    test('400 for missing date_to', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_to: undefined });

      expect(res.status).toBe(400);
    });

    test('400 for a malformed date_to', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_to: '2026/01/12' });

      expect(res.status).toBe(400);
    });

    test('400 when date_to is before date_from', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, date_from: '2026-01-12', date_to: '2026-01-10' });

      expect(res.status).toBe(400);
    });

    test('400 for missing reason', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, reason: undefined });

      expect(res.status).toBe(400);
    });

    test('400 for a reason over 1000 characters', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(parent))
        .send({ ...validExcuse, reason: 'a'.repeat(1001) });

      expect(res.status).toBe(400);
    });

    test('403 for a parent not linked to the child', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(parent))
        .send(validExcuse);

      expect(res.status).toBe(403);
    });

    test('404 for an unknown excuse', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/999999999`)
        .set('Authorization', authHeader(parent))
        .send(validExcuse);

      expect(res.status).toBe(404);
    });

    test('404 for an excuse belonging to a different child', async () => {
      const parent = track('users', await createTestUser('parent'));
      const childA = track('children', await createTestChild());
      const childB = track('children', await createTestChild());
      track('childParents', await linkParent(childB.id, parent.id));
      const excuse = track('childExcuses', await createTestExcuse(childA.id, parent.id));

      const res = await request(app)
        .put(`/api/children/${childB.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(parent))
        .send(validExcuse);

      expect(res.status).toBe(404);
    });

    test("404 for another parent's excuse", async () => {
      const owningParent = track('users', await createTestUser('parent'));
      const otherParent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, otherParent.id));
      const excuse = track('childExcuses', await createTestExcuse(child.id, owningParent.id));

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(otherParent))
        .send(validExcuse);

      expect(res.status).toBe(404);
    });

    test('200 with the updated excuse on success', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      const excuse = track('childExcuses', await createTestExcuse(child.id, parent.id));

      const updatedFields = {
        date_from: '2026-02-01',
        date_to: '2026-02-03',
        reason: 'Updated reason',
      };

      const res = await request(app)
        .put(`/api/children/${child.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(parent))
        .send(updatedFields);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: excuse.id,
        childId: child.id,
        parentId: parent.id,
        dateFrom: updatedFields.date_from,
        dateTo: updatedFields.date_to,
        reason: updatedFields.reason,
      });

      const [persisted] = await db
        .select()
        .from(childExcuses)
        .where(eq(childExcuses.id, excuse.id));
      expect(persisted).toMatchObject({
        dateFrom: updatedFields.date_from,
        dateTo: updatedFields.date_to,
        reason: updatedFields.reason,
      });
    });
  });

  describe('DELETE /api/children/:id/excuses/:excuseId', () => {
    test('400 for a non-integer child id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .delete('/api/children/not-a-number/excuses/1')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('400 for a non-integer excuse id', async () => {
      const admin = track('users', await createTestUser('admin'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .delete(`/api/children/${child.id}/excuses/not-a-number`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('403 for a role that is neither parent nor admin', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .delete(`/api/children/${child.id}/excuses/1`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(403);
    });

    test('404 for an unknown excuse id', async () => {
      const admin = track('users', await createTestUser('admin'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .delete(`/api/children/${child.id}/excuses/999999999`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(404);
    });

    test("400 when the excuse's child_id doesn't match the URL's child id", async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));
      const childA = track('children', await createTestChild());
      const childB = track('children', await createTestChild());
      const excuse = track('childExcuses', await createTestExcuse(childA.id, parent.id));

      const res = await request(app)
        .delete(`/api/children/${childB.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('parent: 403 when not linked to the child', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      const excuse = track('childExcuses', await createTestExcuse(child.id, parent.id));

      const res = await request(app)
        .delete(`/api/children/${child.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('parent: 403 when the excuse belongs to another parent', async () => {
      const owningParent = track('users', await createTestUser('parent'));
      const otherParent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, otherParent.id));
      const excuse = track('childExcuses', await createTestExcuse(child.id, owningParent.id));

      const res = await request(app)
        .delete(`/api/children/${child.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(otherParent));

      expect(res.status).toBe(403);
    });

    test('200 on success for the owning parent', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      const excuse = track('childExcuses', await createTestExcuse(child.id, parent.id));

      const res = await request(app)
        .delete(`/api/children/${child.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Excuse cancelled' });

      const remaining = await db.select().from(childExcuses).where(eq(childExcuses.id, excuse.id));
      expect(remaining).toHaveLength(0);
    });

    test('200 on success for admin (any excuse)', async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      const excuse = track('childExcuses', await createTestExcuse(child.id, parent.id));

      const res = await request(app)
        .delete(`/api/children/${child.id}/excuses/${excuse.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Excuse cancelled' });

      const remaining = await db.select().from(childExcuses).where(eq(childExcuses.id, excuse.id));
      expect(remaining).toHaveLength(0);
    });
  });
});
