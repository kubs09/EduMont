import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
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

describe('POST /api/presentations/categories (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
    jest.restoreAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .post('/api/presentations/categories')
      .send({ category: 'X', name: 'Y', age_group: 'Toddler', display_order: 1 });

    expect(res.status).toBe(401);
  });

  test('inserting into the middle of a 4-row bucket bumps later rows into a clean 1..5 sequence', async () => {
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
      .post('/api/presentations/categories')
      .set('Authorization', authHeader(admin))
      .send({ category, name: 'New Middle Task', age_group: ageGroup, display_order: 2 });

    expect(res.status).toBe(201);
    track('categoryPresentations', res.body);

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
      { id: res.body.id, displayOrder: 2 },
      { id: rows[1].id, displayOrder: 3 },
      { id: rows[2].id, displayOrder: 4 },
      { id: rows[3].id, displayOrder: 5 },
    ]);
  });

  test('inserting at the end of the bucket appends without disturbing existing rows', async () => {
    const admin = track('users', await createTestUser('admin'));
    const category = uniqueCategory('Sensorial');
    const ageGroup = 'Toddler';

    const rows = [];
    for (let order = 1; order <= 3; order += 1) {
      rows.push(
        track(
          'categoryPresentations',
          await createTestCategoryPresentation({ category, ageGroup, displayOrder: order })
        )
      );
    }

    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader(admin))
      .send({ category, name: 'New End Task', age_group: ageGroup, display_order: 4 });

    expect(res.status).toBe(201);
    track('categoryPresentations', res.body);

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
      { id: rows[1].id, displayOrder: 2 },
      { id: rows[2].id, displayOrder: 3 },
      { id: res.body.id, displayOrder: 4 },
    ]);
  });

  test('400 on a 23505 unique-violation, mocking db.transaction to reject (real lock-conflict infra deemed disproportionate)', async () => {
    const admin = track('users', await createTestUser('admin'));
    const error = new Error('duplicate key value violates unique constraint');
    error.code = '23505';
    jest.spyOn(db, 'transaction').mockRejectedValueOnce(error);

    const res = await request(app)
      .post('/api/presentations/categories')
      .set('Authorization', authHeader(admin))
      .send({
        category: uniqueCategory('Conflict'),
        name: 'X',
        age_group: 'Toddler',
        display_order: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'A presentation with this category and display order already exists',
    });
  });
});
