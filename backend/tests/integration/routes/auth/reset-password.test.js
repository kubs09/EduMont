import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { compare } from 'bcryptjs';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { users } = await import('#backend/db/schema.js');
const { eq } = await import('drizzle-orm');

describe('POST /api/reset-password (integration)', () => {
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

  test('updates the password and clears the reset token for a valid token', async () => {
    const token = 'c'.repeat(64);
    [testUser] = await db
      .insert(users)
      .values({
        email: `reset-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        firstname: 'Integration',
        surname: 'Test',
        password: 'old-hash',
        role: 'parent',
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      })
      .returning();

    const res = await request(app)
      .post('/api/reset-password')
      .send({ token, password: 'brandNewPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/successful/i);

    const [updated] = await db.select().from(users).where(eq(users.id, testUser.id));
    expect(updated.resetToken).toBeNull();
    expect(updated.resetTokenExpiry).toBeNull();
    await expect(compare('brandNewPassword123', updated.password)).resolves.toBe(true);
  });

  test('rejects an expired token and leaves the password unchanged', async () => {
    const token = 'd'.repeat(64);
    [testUser] = await db
      .insert(users)
      .values({
        email: `reset-expired-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        firstname: 'Integration',
        surname: 'Test',
        password: 'old-hash',
        role: 'parent',
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() - 1000),
      })
      .returning();

    const res = await request(app)
      .post('/api/reset-password')
      .send({ token, password: 'brandNewPassword123' });

    expect(res.status).toBe(400);

    const [updated] = await db.select().from(users).where(eq(users.id, testUser.id));
    expect(updated.password).toBe('old-hash');
  });
});
