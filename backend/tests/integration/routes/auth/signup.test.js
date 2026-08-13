import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { users } = await import('#backend/db/schema.js');
const { eq } = await import('drizzle-orm');

describe('POST /api/signup (integration)', () => {
  let testUser;

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    if (testUser) {
      await db.delete(users).where(eq(users.id, testUser.id));
      testUser = undefined;
    }
  });

  test('creates a new user and returns 201', async () => {
    const email = `signup-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

    const res = await request(app).post('/api/signup').send({
      email,
      password: 'brandNewPassword123',
      firstName: 'Integration',
      lastName: 'Test',
    });

    expect(res.status).toBe(201);

    const [created] = await db.select().from(users).where(eq(users.email, email));
    expect(created).toBeDefined();
    testUser = created;
  });

  test('returns 400 "Email already registered" for a duplicate email', async () => {
    const email = `signup-dup-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    [testUser] = await db
      .insert(users)
      .values({
        email,
        firstname: 'Existing',
        surname: 'User',
        password: 'placeholder-hash',
        role: 'parent',
      })
      .returning();

    const res = await request(app).post('/api/signup').send({
      email,
      password: 'anotherPassword123',
      firstName: 'Integration',
      lastName: 'Test',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already registered');
  });
});
