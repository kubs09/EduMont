import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';
import { createSupabaseMock } from '../../../helpers/supabaseMock.js';

const dbMock = { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };
const supabaseMock = createSupabaseMock();

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

jest.unstable_mockModule('#backend/config/supabase.js', () => ({
  __esModule: true,
  default: supabaseMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const validDocument = {
  title: 'Report Card',
  file_url: 'https://storage.example.com/documents/report.pdf',
  child_id: 5,
};

describe('POST /api/documents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/documents').send(validDocument);

    expect(res.status).toBe(401);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a missing title', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, title: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a blank title', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, title: '   ' });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a missing file_url', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, file_url: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a blank file_url', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, file_url: '   ' });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a title over 200 characters', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, title: 'a'.repeat(201) });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a file_name over 255 characters', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, file_name: 'a'.repeat(256) });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a mime_type over 100 characters', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, mime_type: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a description over 1000 characters', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, description: 'a'.repeat(1001) });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a negative size_bytes', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, size_bytes: -1 });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a non-integer size_bytes', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, size_bytes: 1.5 });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a non-integer class_id', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, class_id: 1.5 });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 for a non-integer child_id', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, child_id: 1.5 });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('400 when neither class_id nor child_id is present', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ title: 'Report Card', file_url: validDocument.file_url });

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('403 when a parent is not linked to the given child', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }))
      .send(validDocument);

    expect(res.status).toBe(403);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('403 when a teacher is not linked to the given class', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
      .send({ title: 'Notice', file_url: validDocument.file_url, class_id: 3 });

    expect(res.status).toBe(403);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('201 when a parent linked to their own child creates a document', async () => {
    const created = { id: 1, title: 'Report Card', childId: 5, classId: null };
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
    dbMock.insert.mockReturnValueOnce(makeChain([created]));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }))
      .send(validDocument);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  test("400 when both child_id and class_id are given but the child isn't in that class", async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, class_id: 3 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  test('201 on success with class_id only', async () => {
    const created = { id: 2, title: 'Notice', classId: 3, childId: null };
    dbMock.insert.mockReturnValueOnce(makeChain([created]));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ title: 'Notice', file_url: validDocument.file_url, class_id: 3 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  test('201 on success with child_id only', async () => {
    const created = { id: 3, title: 'Report Card', classId: null, childId: 5 };
    dbMock.insert.mockReturnValueOnce(makeChain([created]));

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validDocument);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  test('201 on success with both class_id and child_id', async () => {
    const created = { id: 4, title: 'Report Card', classId: 3, childId: 5 };
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 1 }]));
    dbMock.insert.mockReturnValueOnce(makeChain([created]));
    // ensureChildInClass is the only db.select call here since admin's
    // canAccessDocumentByIds check short-circuits without touching the db

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validDocument, class_id: 3 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });
});
