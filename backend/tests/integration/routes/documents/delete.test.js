import { jest, describe, afterEach, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { signTestToken } from '../../../helpers/auth.js';
import { createSupabaseMock } from '../../../helpers/supabaseMock.js';
import {
  createTestUser,
  createTestChild,
  createTestDocument,
  linkParent,
  createCleanupTracker,
} from '../../../helpers/fixtures.js';

const supabaseMock = createSupabaseMock();

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

jest.unstable_mockModule('#backend/config/supabase.js', () => ({
  __esModule: true,
  default: supabaseMock,
}));

const { default: app } = await import('#backend/server.js');
const { default: pool, db } = await import('#backend/config/database.js');
const { documents } = await import('#backend/db/schema.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

describe('DELETE /api/documents/:id (integration)', () => {
  const { track, cleanup } = createCleanupTracker();

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await cleanup();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/documents/1');

    expect(res.status).toBe(401);
  });

  test("404 when the document doesn't exist", async () => {
    const admin = track('users', await createTestUser('admin'));

    const res = await request(app)
      .delete('/api/documents/999999999')
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(404);
  });

  test('403 for an unlinked teacher', async () => {
    const teacher = track('users', await createTestUser('teacher'));
    const child = track('children', await createTestChild());
    const document = track('documents', await createTestDocument({ childId: child.id }));

    const res = await request(app)
      .delete(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(teacher));

    expect(res.status).toBe(403);
  });

  test("403 for a parent whose child isn't this document's child", async () => {
    const parent = track('users', await createTestUser('parent'));
    const ownChild = track('children', await createTestChild());
    track('childParents', await linkParent(ownChild.id, parent.id));
    const otherChild = track('children', await createTestChild());
    const document = track('documents', await createTestDocument({ childId: otherChild.id }));

    const res = await request(app)
      .delete(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(parent));

    expect(res.status).toBe(403);
  });

  test("200 when a parent linked to their own child deletes that child's document", async () => {
    const parent = track('users', await createTestUser('parent'));
    const child = track('children', await createTestChild());
    track('childParents', await linkParent(child.id, parent.id));
    const document = await createTestDocument({ childId: child.id });
    supabaseMock.storage.from().remove.mockResolvedValueOnce({ error: null });

    const res = await request(app)
      .delete(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(parent));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Document deleted successfully' });

    const remaining = await db.select().from(documents).where(eq(documents.id, document.id));
    expect(remaining).toHaveLength(0);
  });

  test('200 on success: storage removal is called with the path extracted from file_url, and the row is gone', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());
    const fileUrl =
      'https://project.supabase.co/storage/v1/object/public/documents/child-x/1700000000-report.pdf';
    const document = await createTestDocument({ childId: child.id, fileUrl });
    supabaseMock.storage.from().remove.mockResolvedValueOnce({ error: null });

    const res = await request(app)
      .delete(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    expect(supabaseMock.storage.from).toHaveBeenCalledWith('documents');
    expect(supabaseMock.storage.from().remove).toHaveBeenCalledWith([
      'child-x/1700000000-report.pdf',
    ]);

    const remaining = await db.select().from(documents).where(eq(documents.id, document.id));
    expect(remaining).toHaveLength(0);
  });

  test('200 and the row is still deleted even when the mocked storage .remove() call errors', async () => {
    const admin = track('users', await createTestUser('admin'));
    const child = track('children', await createTestChild());
    const fileUrl =
      'https://project.supabase.co/storage/v1/object/public/documents/child-x/1700000000-report.pdf';
    const document = await createTestDocument({ childId: child.id, fileUrl });
    supabaseMock.storage.from().remove.mockResolvedValueOnce({ error: { message: 'boom' } });

    const res = await request(app)
      .delete(`/api/documents/${document.id}`)
      .set('Authorization', authHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Document deleted successfully' });

    const remaining = await db.select().from(documents).where(eq(documents.id, document.id));
    expect(remaining).toHaveLength(0);
  });
});
