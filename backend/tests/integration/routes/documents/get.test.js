import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { signTestToken } from '../../../helpers/auth.js';
import { createSupabaseMock } from '../../../helpers/supabaseMock.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  createTestDocument,
  linkParent,
  linkTeacher,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

jest.unstable_mockModule('#backend/config/supabase.js', () => ({
  __esModule: true,
  default: createSupabaseMock(),
}));

const { default: app } = await import('#backend/server.js');
const { default: pool } = await import('#backend/config/database.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('documents routes: get (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/documents');

    expect(res.status).toBe(401);
  });

  describe('GET /api/documents', () => {
    test('403 for a parent with neither class_id nor child_id', async () => {
      const parent = track('users', await createTestUser('parent'));

      const res = await request(app).get('/api/documents').set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('400 for a non-numeric class_id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/documents?class_id=abc')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('400 for a non-numeric child_id', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/documents?child_id=abc')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test('400 for a non-numeric created_by', async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/documents?created_by=abc')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(400);
    });

    test("403 for a teacher not linked to the requested class_id", async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get(`/api/documents?class_id=${testClass.id}`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(403);
    });

    test("403 for a parent not linked to the requested child_id", async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .get(`/api/documents?child_id=${child.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 for admin, returning everything unfiltered', async () => {
      const admin = track('users', await createTestUser('admin'));
      const child = track('children', await createTestChild());
      const document = track('documents', await createTestDocument({ childId: child.id }));

      const res = await request(app).get('/api/documents').set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: document.id, child_id: child.id })])
      );
    });

    test('created_by filters results without itself gating access', async () => {
      const admin = track('users', await createTestUser('admin'));
      const creator = track('users', await createTestUser('teacher'));
      const child = track('children', await createTestChild());
      const document = track(
        'documents',
        await createTestDocument({ childId: child.id, createdBy: creator.id })
      );

      const res = await request(app)
        .get(`/api/documents?created_by=${creator.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: document.id })]);
    });
  });

  describe('GET /api/documents/child/:childId', () => {
    test("403 when the caller isn't linked to the child", async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());

      const res = await request(app)
        .get(`/api/documents/child/${child.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 with results for a linked parent', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      const document = track('documents', await createTestDocument({ childId: child.id }));

      const res = await request(app)
        .get(`/api/documents/child/${child.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: document.id, child_id: child.id })]);
    });
  });

  describe('GET /api/documents/class/:classId', () => {
    test("403 when the caller isn't linked to the class", async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());

      const res = await request(app)
        .get(`/api/documents/class/${testClass.id}`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(403);
    });

    test('200 with results for a linked teacher', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const document = track('documents', await createTestDocument({ classId: testClass.id }));

      const res = await request(app)
        .get(`/api/documents/class/${testClass.id}`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({ id: document.id, class_id: testClass.id }),
      ]);
    });
  });

  describe('GET /api/documents/:id', () => {
    test("404 when the document doesn't exist", async () => {
      const admin = track('users', await createTestUser('admin'));

      const res = await request(app)
        .get('/api/documents/999999999')
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(404);
    });

    test("403 when the caller isn't linked to the document's child/class", async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      const document = track('documents', await createTestDocument({ childId: child.id }));

      const res = await request(app)
        .get(`/api/documents/${document.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(403);
    });

    test('200 for a linked parent', async () => {
      const parent = track('users', await createTestUser('parent'));
      const child = track('children', await createTestChild());
      track('childParents', await linkParent(child.id, parent.id));
      const document = track('documents', await createTestDocument({ childId: child.id }));

      const res = await request(app)
        .get(`/api/documents/${document.id}`)
        .set('Authorization', authHeader(parent));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ id: document.id, child_id: child.id }));
    });

    test('200 for a linked teacher', async () => {
      const teacher = track('users', await createTestUser('teacher'));
      const testClass = track('classes', await createTestClass());
      track('classTeachers', await linkTeacher(testClass.id, teacher.id));
      const document = track('documents', await createTestDocument({ classId: testClass.id }));

      const res = await request(app)
        .get(`/api/documents/${document.id}`)
        .set('Authorization', authHeader(teacher));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ id: document.id, class_id: testClass.id }));
    });

    test('200 for admin', async () => {
      const admin = track('users', await createTestUser('admin'));
      const child = track('children', await createTestChild());
      const document = track('documents', await createTestDocument({ childId: child.id }));

      const res = await request(app)
        .get(`/api/documents/${document.id}`)
        .set('Authorization', authHeader(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ id: document.id }));
    });
  });
});
