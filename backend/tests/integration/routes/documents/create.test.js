import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import { createSupabaseMock } from '../../../helpers/supabaseMock.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  linkParent,
  linkTeacher,
  linkChildToClass,
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
const { default: pool, db } = await import('#backend/config/database.js');
const { documents } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('POST /api/documents (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .post('/api/documents')
      .send({ title: 'Report Card', file_url: 'https://x/report.pdf', child_id: 1 });

    expect(res.status).toBe(401);
  });

  test('400 when neither class_id nor child_id is present', async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(admin))
      .send({ title: 'Report Card', file_url: 'https://x/report.pdf' });

    expect(res.status).toBe(400);
  });

  test('403 when a parent is not linked to the given child', async () => {
    const parent = track('users', await createTestUser('parent'));
    const child = track('children', await createTestChild());

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(parent))
      .send({ title: 'Report Card', file_url: 'https://x/report.pdf', child_id: child.id });

    expect(res.status).toBe(403);
  });

  test('403 when a teacher is not linked to the given class', async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(teacher))
      .send({ title: 'Notice', file_url: 'https://x/notice.pdf', class_id: testClass.id });

    expect(res.status).toBe(403);
  });

  test('201 when a parent linked to their own child creates a document', async () => {
    const parent = track('users', await createTestUser('parent'));
    const child = track('children', await createTestChild());
    track('childParents', await linkParent(child.id, parent.id));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(parent))
      .send({ title: 'Report Card', file_url: 'https://x/report.pdf', child_id: child.id });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Report Card',
      childId: child.id,
      createdBy: parent.id,
    });
    track('documents', res.body);
  });

  test('201 when a teacher with an assistant role creates a document for their class', async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(testClass.id, teacher.id, 'assistant'));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(teacher))
      .send({ title: 'Notice', file_url: 'https://x/notice.pdf', class_id: testClass.id });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Notice', classId: testClass.id });
    track('documents', res.body);
  });

  test("400 when both child_id and class_id are given but the child isn't in that class", async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());
    const testClass = track('classes', await createTestClass());

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(admin))
      .send({
        title: 'Report Card',
        file_url: 'https://x/report.pdf',
        child_id: child.id,
        class_id: testClass.id,
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
  });

  test('201 on success with class_id only', async () => {
    const admin = track('users', await createTestUser('admin'));
    const testClass = track('classes', await createTestClass());

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(admin))
      .send({ title: 'Notice', file_url: 'https://x/notice.pdf', class_id: testClass.id });

    expect(res.status).toBe(201);
    track('documents', res.body);

    const [persisted] = await db.select().from(documents).where(eq(documents.id, res.body.id));
    expect(persisted).toMatchObject({ title: 'Notice', classId: testClass.id, childId: null });
  });

  test('201 on success with child_id only', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(admin))
      .send({ title: 'Report Card', file_url: 'https://x/report.pdf', child_id: child.id });

    expect(res.status).toBe(201);
    track('documents', res.body);

    const [persisted] = await db.select().from(documents).where(eq(documents.id, res.body.id));
    expect(persisted).toMatchObject({ title: 'Report Card', childId: child.id, classId: null });
  });

  test('201 on success with both class_id and child_id', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());
    const testClass = track('classes', await createTestClass());
    track('classChildren', await linkChildToClass(child.id, testClass.id));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader(admin))
      .send({
        title: 'Report Card',
        file_url: 'https://x/report.pdf',
        child_id: child.id,
        class_id: testClass.id,
      });

    expect(res.status).toBe(201);
    track('documents', res.body);

    const [persisted] = await db.select().from(documents).where(eq(documents.id, res.body.id));
    expect(persisted).toMatchObject({
      title: 'Report Card',
      childId: child.id,
      classId: testClass.id,
    });
  });
});
