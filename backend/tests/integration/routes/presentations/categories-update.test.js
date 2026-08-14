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

const seedBucket = (track, category, ageGroup, count) => {
  const rows = [];
  return (async () => {
    for (let order = 1; order <= count; order += 1) {
      rows.push(
        track(
          'categoryPresentations',
          await createTestCategoryPresentation({ category, ageGroup, displayOrder: order })
        )
      );
    }
    return rows;
  })();
};

const fetchBucket = (category, ageGroup) =>
  db
    .select({
      id: categoryPresentations.id,
      displayOrder: categoryPresentations.displayOrder,
    })
    .from(categoryPresentations)
    .where(
      and(
        eq(categoryPresentations.category, category),
        eq(categoryPresentations.ageGroup, ageGroup)
      )
    )
    .orderBy(asc(categoryPresentations.displayOrder));

describe('PUT /api/presentations/categories/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).put('/api/presentations/categories/1').send({ name: 'X' });

    expect(res.status).toBe(401);
  });

  test('reordering up within a bucket produces a correct contiguous final sequence', async () => {
    const admin = track('users', await createTestUser('admin'));
    const category = uniqueCategory('Practical Life');
    const ageGroup = 'Toddler';
    const rows = await seedBucket(track, category, ageGroup, 5);

    const res = await request(app)
      .put(`/api/presentations/categories/${rows[1].id}`)
      .set('Authorization', authHeader(admin))
      .send({ display_order: 4 });

    expect(res.status).toBe(200);
    expect(res.body.display_order).toBe(4);

    const final = await fetchBucket(category, ageGroup);
    expect(final).toEqual([
      { id: rows[0].id, displayOrder: 1 },
      { id: rows[2].id, displayOrder: 2 },
      { id: rows[3].id, displayOrder: 3 },
      { id: rows[1].id, displayOrder: 4 },
      { id: rows[4].id, displayOrder: 5 },
    ]);
  });

  test('reordering down within a bucket produces a correct contiguous final sequence', async () => {
    const admin = track('users', await createTestUser('admin'));
    const category = uniqueCategory('Sensorial');
    const ageGroup = 'Toddler';
    const rows = await seedBucket(track, category, ageGroup, 5);

    const res = await request(app)
      .put(`/api/presentations/categories/${rows[3].id}`)
      .set('Authorization', authHeader(admin))
      .send({ display_order: 2 });

    expect(res.status).toBe(200);
    expect(res.body.display_order).toBe(2);

    const final = await fetchBucket(category, ageGroup);
    expect(final).toEqual([
      { id: rows[0].id, displayOrder: 1 },
      { id: rows[3].id, displayOrder: 2 },
      { id: rows[1].id, displayOrder: 3 },
      { id: rows[2].id, displayOrder: 4 },
      { id: rows[4].id, displayOrder: 5 },
    ]);
  });

  test('moving a row to a different bucket leaves both the source and destination buckets contiguous', async () => {
    const admin = track('users', await createTestUser('admin'));
    const sourceCategory = uniqueCategory('Language');
    const destCategory = uniqueCategory('Math');
    const ageGroup = 'Toddler';
    const sourceRows = await seedBucket(track, sourceCategory, ageGroup, 3);
    const destRows = await seedBucket(track, destCategory, ageGroup, 2);

    const res = await request(app)
      .put(`/api/presentations/categories/${sourceRows[1].id}`)
      .set('Authorization', authHeader(admin))
      .send({ category: destCategory, display_order: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ category: destCategory, display_order: 2 });

    const finalSource = await fetchBucket(sourceCategory, ageGroup);
    expect(finalSource).toEqual([
      { id: sourceRows[0].id, displayOrder: 1 },
      { id: sourceRows[2].id, displayOrder: 2 },
    ]);

    const finalDest = await fetchBucket(destCategory, ageGroup);
    expect(finalDest).toEqual([
      { id: destRows[0].id, displayOrder: 1 },
      { id: sourceRows[1].id, displayOrder: 2 },
      { id: destRows[1].id, displayOrder: 3 },
    ]);
  });

  test('a field-only update leaves all display_order values untouched', async () => {
    const admin = track('users', await createTestUser('admin'));
    const category = uniqueCategory('Practical Life');
    const ageGroup = 'Toddler';
    const rows = await seedBucket(track, category, ageGroup, 3);

    const res = await request(app)
      .put(`/api/presentations/categories/${rows[1].id}`)
      .set('Authorization', authHeader(admin))
      .send({ notes: 'Updated notes only' });

    expect(res.status).toBe(200);
    expect(res.body.notes).toBe('Updated notes only');
    expect(res.body.display_order).toBe(2);

    const final = await fetchBucket(category, ageGroup);
    expect(final).toEqual([
      { id: rows[0].id, displayOrder: 1 },
      { id: rows[1].id, displayOrder: 2 },
      { id: rows[2].id, displayOrder: 3 },
    ]);
  });
});
