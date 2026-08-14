import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { signTestToken } from '../../../helpers/auth.js';
import {
  createTestUser,
  createTestChild,
  linkParent,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool } = await import('#backend/config/database.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('users list routes (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(401);
  });

  describe('GET /api/users', () => {
    test('unfiltered list includes every role', async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));
      const teacher = track('users', await createTestUser('teacher'));

      const res = await request(app).get('/api/users').set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      const ids = res.body.map((u) => u.id);
      expect(ids).toEqual(expect.arrayContaining([admin.id, parent.id, teacher.id]));
    });

    test('role-filtered list only includes the requested role', async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));
      const teacher = track('users', await createTestUser('teacher'));

      const res = await request(app)
        .get('/api/users?role=parent')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      const ids = res.body.map((u) => u.id);
      expect(ids).toContain(parent.id);
      expect(ids).not.toContain(teacher.id);
    });
  });

  describe('GET /api/users/:id', () => {
    test('404 for an unknown id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/users/999999999')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(404);
    });

    test('200 for self', async () => {
      const parent = track('users', await createTestUser('parent'));

      const res = await request(app)
        .get(`/api/users/${parent.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: parent.id, email: parent.email });
    });

    test('200 for an admin viewing anyone', async () => {
      const admin = track('users', await createTestUser('admin'));
      const parent = track('users', await createTestUser('parent'));

      const res = await request(app)
        .get(`/api/users/${parent.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
    });

    test('200 for a parent viewing a teacher', async () => {
      const parent = track('users', await createTestUser('parent'));
      const teacher = track('users', await createTestUser('teacher'));

      const res = await request(app)
        .get(`/api/users/${teacher.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
    });

    test('200 for a teacher viewing a parent', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const parent = track('users', await createTestUser('parent'));

      const res = await request(app)
        .get(`/api/users/${parent.id}`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
    });

    test('200 for a teacher viewing another teacher', async () => {
      const teacher1 = track('users', await createTestUser('teacher'));
      const teacher2 = track('users', await createTestUser('teacher'));

      const res = await request(app)
        .get(`/api/users/${teacher2.id}`)
        .set('Authorization', authHeader(teacher1));

      expect(res.status).toBe(200);
    });

    test('200 for a parent viewing another parent sharing a child', async () => {
      const parent1 = track('users', await createTestUser('parent'));
      const parent2 = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent1.id));
      track('childParents', await linkParent(child.id, parent2.id));

      const res = await request(app)
        .get(`/api/users/${parent2.id}`)
        .set('Authorization', authHeader(parent1));

      expect(res.status).toBe(200);
    });

    test('403 for a parent viewing another parent without a shared child', async () => {
      const parent1 = track('users', await createTestUser('parent'));
      const parent2 = track('users', await createTestUser('parent'));

      const res = await request(app)
        .get(`/api/users/${parent2.id}`)
        .set('Authorization', authHeader(parent1));

      expect(res.status).toBe(403);
    });
  });
});
