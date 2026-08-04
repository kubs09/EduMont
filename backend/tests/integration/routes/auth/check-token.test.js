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

describe('GET /api/check-token/:token (integration)', () => {
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

  test('reports a live token as valid', async () => {
    const token = 'a'.repeat(64);
    [testUser] = await db
      .insert(users)
      .values({
        email: `check-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        firstname: 'Integration',
        surname: 'Test',
        password: 'placeholder-hash',
        role: 'parent',
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      })
      .returning();

    const res = await request(app).get(`/api/check-token/${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: true, expired: false });
  });

  test('reports an expired token as expired', async () => {
    const token = 'b'.repeat(64);
    [testUser] = await db
      .insert(users)
      .values({
        email: `check-expired-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        firstname: 'Integration',
        surname: 'Test',
        password: 'placeholder-hash',
        role: 'parent',
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() - 60 * 60 * 1000),
      })
      .returning();

    const res = await request(app).get(`/api/check-token/${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: true, expired: true });
  });

  test('reports an unknown token as invalid', async () => {
    const res = await request(app).get('/api/check-token/does-not-exist');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: false, expired: false });
  });
});
