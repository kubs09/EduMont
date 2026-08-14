import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import { createSupabaseMock } from '../../../helpers/supabaseMock.js';
import {
  createTestUser,
  createTestClass,
  createTestChild,
  createTestDocument,
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

const validUpdate = {
  title: 'Updated Report Card',
  file_url: 'https://storage.example.com/documents/report-v2.pdf',
};

describe('PUT /api/documents/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .send({ ...validUpdate, child_id: 1 });

    expect(res.status).toBe(401);
  });

  test("404 when the document doesn't exist", async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .put('/api/documents/999999999')
      .set('Authorization', authHeader(admin))
      .send({ ...validUpdate, child_id: 1 });

    expect(res.status).toBe(404);
  });

  test('400 when neither class_id nor child_id is present', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());
    const document = track('documents', await createTestDocument({ childId: child.id }));

    const res = await request(app)
      .put(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(admin))
      .send(validUpdate);

    expect(res.status).toBe(400);
  });

  test("403 when the caller can't edit the existing document's child/class", async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const child = track('children', await createTestChild());
    const document = track('documents', await createTestDocument({ childId: child.id }));

    const res = await request(app)
      .put(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(teacher))
      .send({ ...validUpdate, child_id: child.id });

    expect(res.status).toBe(403);
  });

  test("403 when the caller can't edit the new child/class being moved to", async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const testClass = track('classes', await createTestClass());
    track('classTeachers', await linkTeacher(testClass.id, teacher.id));
    const ownChild = track('children', await createTestChild());
    track('classChildren', await linkChildToClass(ownChild.id, testClass.id));
    const document = track('documents', await createTestDocument({ childId: ownChild.id }));
    const otherChild = track('children', await createTestChild());

    const res = await request(app)
      .put(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(teacher))
      .send({ ...validUpdate, child_id: otherChild.id });

    expect(res.status).toBe(403);
  });

  test("200 when a parent linked to their own child updates that child's document", async () => {
    const parent = track('users', await createTestUser('parent'));
    const child = track('children', await createTestChild());
    track('childParents', await linkParent(child.id, parent.id));
    const document = track('documents', await createTestDocument({ childId: child.id }));

    const res = await request(app)
      .put(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(parent))
      .send({ ...validUpdate, child_id: child.id });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: document.id, title: validUpdate.title, childId: child.id });

    const [persisted] = await db.select().from(documents).where(eq(documents.id, document.id));
    expect(persisted).toMatchObject({ title: validUpdate.title });
  });

  test('403 when a parent tries to edit a document belonging to a different child', async () => {
    const parent = track('users', await createTestUser('parent'));
    const ownChild = track('children', await createTestChild());
    track('childParents', await linkParent(ownChild.id, parent.id));
    const otherChild = track('children', await createTestChild());
    const document = track('documents', await createTestDocument({ childId: otherChild.id }));

    const res = await request(app)
      .put(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(parent))
      .send({ ...validUpdate, child_id: otherChild.id });

    expect(res.status).toBe(403);
  });

  test("400 when moving to a child_id + class_id combination where the child isn't in that class", async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());
    const document = track('documents', await createTestDocument({ childId: child.id }));
    const testClass = track('classes', await createTestClass());

    const res = await request(app)
      .put(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(admin))
      .send({ ...validUpdate, child_id: child.id, class_id: testClass.id });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
  });

  test('200 on success', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());
    const document = track('documents', await createTestDocument({ childId: child.id }));

    const res = await request(app)
      .put(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(admin))
      .send({ ...validUpdate, child_id: child.id });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: document.id, title: validUpdate.title });

    const [persisted] = await db.select().from(documents).where(eq(documents.id, document.id));
    expect(persisted).toMatchObject({ title: validUpdate.title, fileUrl: validUpdate.file_url });
  });
});
