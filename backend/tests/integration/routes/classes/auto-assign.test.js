import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

// This file is intentionally excluded from the normal parallel integration
// run and executed in its own isolated pass (see backend/package.json's
// "test" script). The auto-assign route does `tx.delete(classChildren)`
// unconditionally against the whole table before reassigning every
// unassigned child in the DB, which would otherwise race with classChildren
// fixtures created by other integration test files running concurrently in
// separate Jest workers against the same test database.
jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { classChildren } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const dateOfBirthForAge = (age) => {
  const now = new Date();
  return `${now.getFullYear() - age}-01-01`;
};

describe('POST /api/classes/auto-assign (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('403 for non-admin', async () => {
    const teacher = track('users', await createTestUser('teacher'));

    const res = await request(app)
      .post('/api/classes/auto-assign')
      .set('Authorization', authHeader(teacher));

    expect(res.status).toBe(403);
  });

  test('assigns children whose age fits a class range and leaves the rest unassigned', async () => {
    const admin = track('users', await createTestUser('admin'));
    const fittingClass = track('classes', await createTestClass({ minAge: 76, maxAge: 78 }));
    const fittingChild = track('children', await createTestChild({ dateOfBirth: dateOfBirthForAge(77) }));
    const strandedChild = track(
      'children',
      await createTestChild({ dateOfBirth: dateOfBirthForAge(131) })
    );

    const res = await request(app)
      .post('/api/classes/auto-assign')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);

    const [fittingLink] = await db
      .select()
      .from(classChildren)
      .where(eq(classChildren.childId, fittingChild.id));
    expect(fittingLink).toBeDefined();
    expect(fittingLink.classId).toBe(fittingClass.id);
    track('classChildren', { childId: fittingChild.id, classId: fittingClass.id });

    const strandedLinks = await db
      .select()
      .from(classChildren)
      .where(eq(classChildren.childId, strandedChild.id));
    expect(strandedLinks).toHaveLength(0);
  });
});
