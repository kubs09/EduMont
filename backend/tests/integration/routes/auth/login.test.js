import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import jsonwebtoken from 'jsonwebtoken';
import { hash, genSalt } from 'bcryptjs';

const { decode } = jsonwebtoken;

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { users } = await import('#backend/db/schema.js');
const { eq } = await import('drizzle-orm');

describe('POST /api/login (integration)', () => {
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

  test('returns 200 and a valid token for correct credentials', async () => {
    const salt = await genSalt(10);
    const hashedPassword = await hash('correctPassword123', salt);
    [testUser] = await db
      .insert(users)
      .values({
        email: `login-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        firstname: 'Integration',
        surname: 'Test',
        password: hashedPassword,
        role: 'admin',
      })
      .returning();

    const res = await request(app)
      .post('/api/login')
      .send({ email: testUser.email, password: 'correctPassword123' });

    expect(res.status).toBe(200);
    const decoded = decode(res.body.token);
    expect(decoded.id).toBe(testUser.id);
    expect(decoded.role).toBe('admin');
  });

  test('returns 401 for the wrong password', async () => {
    const salt = await genSalt(10);
    const hashedPassword = await hash('correctPassword123', salt);
    [testUser] = await db
      .insert(users)
      .values({
        email: `login-wrongpw-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        firstname: 'Integration',
        surname: 'Test',
        password: hashedPassword,
        role: 'parent',
      })
      .returning();

    const res = await request(app)
      .post('/api/login')
      .send({ email: testUser.email, password: 'wrongPassword123' });

    expect(res.status).toBe(401);
  });

  test('returns 401 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'does-not-exist@example.com', password: 'anyPassword123' });

    expect(res.status).toBe(401);
  });
});
