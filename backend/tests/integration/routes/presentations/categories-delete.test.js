import { describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, asc, eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestCategoryPresentation,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { categoryPresentations } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const uniqueCategory = (label) => `${label} ${Date.now()}-${Math.random().toString(36).slice(2)}`;

describe('DELETE /api/presentations/categories/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/presentations/categories/1');

    expect(res.status).toBe(401);
  });

  test('deleting a middle row closes the gap for every later row in the bucket', async () => {
    const admin = track('users', await createTestUser('admin'));
    const category = uniqueCategory('Practical Life');
    const ageGroup = 'Toddler';

    const rows = [];
    for (let order = 1; order <= 4; order += 1) {
      rows.push(
        track(
          'categoryPresentations',
          await createTestCategoryPresentation({ category, ageGroup, displayOrder: order })
        )
      );
    }

    const res = await request(app)
      .delete(`/api/presentations/categories/${rows[1].id}`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Category presentation deleted successfully' });

    const final = await db
      .select({ id: categoryPresentations.id, displayOrder: categoryPresentations.displayOrder })
      .from(categoryPresentations)
      .where(
        and(
          eq(categoryPresentations.category, category),
          eq(categoryPresentations.ageGroup, ageGroup)
        )
      )
      .orderBy(asc(categoryPresentations.displayOrder));

    expect(final).toEqual([
      { id: rows[0].id, displayOrder: 1 },
      { id: rows[2].id, displayOrder: 2 },
      { id: rows[3].id, displayOrder: 3 },
    ]);
  });

  test('404 for a non-existent id', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete('/api/presentations/categories/999999999')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(404);
  });
});
