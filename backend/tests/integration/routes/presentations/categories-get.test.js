import { describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestCategoryPresentation,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

const { default: app } = await import('#backend/server.js');
const { default: pool } = await import('#backend/config/database.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('GET /api/presentations/categories (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token, on all three routes', async () => {
    const listRes = await request(app).get('/api/presentations/categories');
    expect(listRes.status).toBe(401);

    const categoryRes = await request(app).get(
      '/api/presentations/categories/category/Practical Life'
    );
    expect(categoryRes.status).toBe(401);

    const namesRes = await request(app).get('/api/presentations/categories/list/categories');
    expect(namesRes.status).toBe(401);
  });

  test('403 for a non-admin, on all three routes', async () => {
    const teacher = track('users', await createTestUser('teacher'));

    const listRes = await request(app)
      .get('/api/presentations/categories')
      .set('Authorization', authHeader(teacher));
    expect(listRes.status).toBe(403);

    const categoryRes = await request(app)
      .get('/api/presentations/categories/category/Practical Life')
      .set('Authorization', authHeader(teacher));
    expect(categoryRes.status).toBe(403);

    const namesRes = await request(app)
      .get('/api/presentations/categories/list/categories')
      .set('Authorization', authHeader(teacher));
    expect(namesRes.status).toBe(403);
  });

  test('200 confirms ordering across multi-bucket, multi-category seeded data', async () => {
    const admin = track('users', await createTestUser('admin'));
    // This table is global with no per-test scoping key, so use unique category
    // names per test run to avoid colliding with other integration test files
    // seeding the same global bucket concurrently.
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const practicalCategory = `Practical Life ${suffix}`;
    const sensorialCategory = `Sensorial ${suffix}`;

    const sensorialToddler2 = track(
      'categoryPresentations',
      await createTestCategoryPresentation({
        category: sensorialCategory,
        name: 'Pink Tower',
        ageGroup: 'Toddler',
        displayOrder: 2,
      })
    );
    const practicalToddler1 = track(
      'categoryPresentations',
      await createTestCategoryPresentation({
        category: practicalCategory,
        name: 'Pouring',
        ageGroup: 'Toddler',
        displayOrder: 1,
      })
    );
    const practicalInfant1 = track(
      'categoryPresentations',
      await createTestCategoryPresentation({
        category: practicalCategory,
        name: 'Grasping',
        ageGroup: 'Infant',
        displayOrder: 1,
      })
    );

    // Full list: ordered by age group, then category, then display order.
    const listRes = await request(app)
      .get('/api/presentations/categories')
      .set('Authorization', authHeader(admin));
    expect(listRes.status).toBe(200);
    const listIds = listRes.body.map((row) => row.id);
    expect(listIds.indexOf(practicalInfant1.id)).toBeLessThan(
      listIds.indexOf(practicalToddler1.id)
    );
    expect(listIds.indexOf(practicalToddler1.id)).toBeLessThan(
      listIds.indexOf(sensorialToddler2.id)
    );

    // Category-filtered list: only rows for practicalCategory, ordered by age group then display order.
    const categoryRes = await request(app)
      .get(`/api/presentations/categories/category/${practicalCategory}`)
      .set('Authorization', authHeader(admin));
    expect(categoryRes.status).toBe(200);
    expect(categoryRes.body.map((row) => row.id)).toEqual([
      practicalInfant1.id,
      practicalToddler1.id,
    ]);

    // Distinct category names include both seeded categories, alphabetically ordered.
    const namesRes = await request(app)
      .get('/api/presentations/categories/list/categories')
      .set('Authorization', authHeader(admin));
    expect(namesRes.status).toBe(200);
    expect(namesRes.body).toEqual(expect.arrayContaining([practicalCategory, sensorialCategory]));
    expect(namesRes.body.indexOf(practicalCategory)).toBeLessThan(
      namesRes.body.indexOf(sensorialCategory)
    );
  });
});
