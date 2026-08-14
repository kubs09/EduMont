import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  linkParent,
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
const { children, classChildren } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('DELETE /api/children (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/children/1');

    expect(res.status).toBe(401);
  });

  describe('DELETE /api/children/:id', () => {
    test('404 for an unknown child', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .delete('/api/children/999999999')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(404);
    });

    test("403 when a parent isn't linked", async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .delete(`/api/children/${child.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 on success, cascading classChildren cleanup', async () => {
      const admin = track('users', await createTestUser('admin'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      await linkChildToClass(child.id, testClass.id);

      const res = await request(app)
        .delete(`/api/children/${child.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Child deleted successfully' });

      const [remainingChild] = await db.select().from(children).where(eq(children.id, child.id));
      expect(remainingChild).toBeUndefined();

      const remainingLinks = await db
        .select()
        .from(classChildren)
        .where(eq(classChildren.childId, child.id));
      expect(remainingLinks).toHaveLength(0);
    });
  });

  describe('DELETE /api/children/:childId/classes/:classId', () => {
    test('400 for invalid ids', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .delete('/api/children/not-a-number/classes/2')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('404 for an unknown child', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .delete('/api/children/999999999/classes/2')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(404);
    });

    test("403 when a parent isn't linked", async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .delete(`/api/children/${child.id}/classes/${testClass.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 on success, removing the classChildren link only', async () => {
      const parent = track('users', await createTestUser('parent'));
      const testClass = track('classes', await createTestClass());
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      track('classChildren', await linkChildToClass(child.id, testClass.id));

      const res = await request(app)
        .delete(`/api/children/${child.id}/classes/${testClass.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Child removed from class successfully' });

      const remainingLinks = await db
        .select()
        .from(classChildren)
        .where(eq(classChildren.childId, child.id));
      expect(remainingLinks).toHaveLength(0);

      const [remainingChild] = await db.select().from(children).where(eq(children.id, child.id));
      expect(remainingChild).toBeDefined();
    });
  });
});
