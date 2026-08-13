import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import { createTestUser, createTestClass, createCleanupTracker } from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { children, classChildren } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const dateOfBirthForAge = (age) => {
  const now = new Date();
  return `${now.getFullYear() - age}-01-01`;
};

describe('POST /api/children (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/children').send({
      firstname: 'Ada',
      surname: 'Lovelace',
      date_of_birth: dateOfBirthForAge(4),
    });

    expect(res.status).toBe(401);
  });

  test('creates a child with auto-assigned class based on age', async () => {
    const admin = track('users', await createTestUser('admin'));
    const parent = track('users', await createTestUser('parent'));
    const testClass = track('classes', await createTestClass({ minAge: 2, maxAge: 6 }));

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader(admin))
      .send({
        firstname: 'Ada',
        surname: 'Lovelace',
        date_of_birth: dateOfBirthForAge(4),
        parent_ids: [parent.id],
      });

    expect(res.status).toBe(201);
    track('children', res.body);

    const [link] = await db
      .select()
      .from(classChildren)
      .where(eq(classChildren.childId, res.body.id));
    expect(link.classId).toBe(testClass.id);
  });

  test('creates a child with an explicit, suitable class_id', async () => {
    const admin = track('users', await createTestUser('admin'));
    const parent = track('users', await createTestUser('parent'));
    track('classes', await createTestClass({ minAge: 0, maxAge: 2 }));
    const chosenClass = track('classes', await createTestClass({ minAge: 3, maxAge: 8 }));

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader(admin))
      .send({
        firstname: 'Ada',
        surname: 'Lovelace',
        date_of_birth: dateOfBirthForAge(4),
        parent_ids: [parent.id],
        class_id: chosenClass.id,
      });

    expect(res.status).toBe(201);
    track('children', res.body);

    const [link] = await db
      .select()
      .from(classChildren)
      .where(eq(classChildren.childId, res.body.id));
    expect(link.classId).toBe(chosenClass.id);
  });

  test("forces a parent's parent_ids to themselves", async () => {
    const parent = track('users', await createTestUser('parent'));
    track('classes', await createTestClass({ minAge: 0, maxAge: 10 }));

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader(parent))
      .send({ firstname: 'Ada', surname: 'Lovelace', date_of_birth: dateOfBirthForAge(4) });

    expect(res.status).toBe(201);
    track('children', res.body);
    expect(res.body).toMatchObject({ firstname: 'Ada', surname: 'Lovelace' });
  });

  test('400 selectedClassNotSuitable for an unsuitable explicit class_id', async () => {
    const admin = track('users', await createTestUser('admin'));
    const parent = track('users', await createTestUser('parent'));
    const wrongClass = track('classes', await createTestClass({ minAge: 10, maxAge: 15 }));
    const surname = `Lovelace-${Date.now()}`;

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader(admin))
      .send({
        firstname: 'Ada',
        surname,
        date_of_birth: dateOfBirthForAge(4),
        parent_ids: [parent.id],
        class_id: wrongClass.id,
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'selectedClassNotSuitable' });

    const orphans = await db
      .select()
      .from(children)
      .where(and(eq(children.firstname, 'Ada'), eq(children.surname, surname)));
    expect(orphans).toHaveLength(0);
  });

  test('400 noSuitableClass when no class fits the age', async () => {
    const admin = track('users', await createTestUser('admin'));
    const parent = track('users', await createTestUser('parent'));
    track('classes', await createTestClass({ minAge: 10, maxAge: 15 }));
    const surname = `Lovelace-${Date.now()}`;

    const res = await request(app)
      .post('/api/children')
      .set('Authorization', authHeader(admin))
      .send({
        firstname: 'Ada',
        surname,
        date_of_birth: dateOfBirthForAge(4),
        parent_ids: [parent.id],
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'noSuitableClass' });

    const orphans = await db
      .select()
      .from(children)
      .where(and(eq(children.firstname, 'Ada'), eq(children.surname, surname)));
    expect(orphans).toHaveLength(0);
  });
});
