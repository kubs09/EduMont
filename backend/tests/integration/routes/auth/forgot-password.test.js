import { jest, describe, beforeEach, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';

const mailMock = { sendEmail: jest.fn().mockResolvedValue({}) };

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: mailMock,
  sendEmail: mailMock.sendEmail,
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { users } = await import('#backend/db/schema.js');
const { eq } = await import('drizzle-orm');

describe('POST /api/forgot-password (integration)', () => {
  let testUser;

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    [testUser] = await db
      .insert(users)
      .values({
        email: `forgot-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        firstname: 'Integration',
        surname: 'Test',
        password: 'placeholder-hash',
        role: 'parent',
      })
      .returning();
  });

  afterEach(async () => {
    if (testUser) await db.delete(users).where(eq(users.id, testUser.id));
  });

  test('sets a reset token on the user record and sends an email', async () => {
    const res = await request(app).post('/api/forgot-password').send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mailMock.sendEmail).toHaveBeenCalledTimes(1);

    const [updated] = await db.select().from(users).where(eq(users.id, testUser.id));
    expect(updated.resetToken).toHaveLength(64);
    expect(updated.resetTokenExpiry).toBeInstanceOf(Date);
  });

  test('returns success for an unknown email without sending mail', async () => {
    const res = await request(app)
      .post('/api/forgot-password')
      .send({ email: 'does-not-exist@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mailMock.sendEmail).not.toHaveBeenCalled();
  });
});
