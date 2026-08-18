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

const validUpdate = {
  title: 'Updated Report Card',
  file_url: 'https://storage.example.com/documents/report-v2.pdf',
  child_id: 5,
};

describe('PUT /api/documents/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).put('/api/documents/1').send(validUpdate);

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test("404 when the document doesn't exist", async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/documents/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(404);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('400 for a missing title', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, title: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a blank title', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, title: '   ' });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a missing file_url', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, file_url: undefined });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a blank file_url', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, file_url: '   ' });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a title over 200 characters', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, title: 'a'.repeat(201) });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a file_name over 255 characters', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, file_name: 'a'.repeat(256) });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a mime_type over 100 characters', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, mime_type: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a description over 1000 characters', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, description: 'a'.repeat(1001) });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a negative size_bytes', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, size_bytes: -1 });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a non-integer size_bytes', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, size_bytes: 1.5 });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a non-integer class_id', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, class_id: 1.5 });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 for a non-integer child_id', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, child_id: 1.5 });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('400 when neither class_id nor child_id is present', async () => {
    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ title: 'Updated Report Card', file_url: validUpdate.file_url });

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test("403 when the caller can't edit the existing document's child/class", async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 1, childId: 9, classId: null }]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
      .send(validUpdate);

    expect(res.status).toBe(403);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test("403 when the caller can't edit the new child/class being moved to", async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 1, childId: 5, classId: null }]))
      .mockReturnValueOnce(makeChain([{ id: 1 }]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
      .send({ ...validUpdate, child_id: 8 });

    expect(res.status).toBe(403);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test("200 when a parent linked to their own child updates that child's document", async () => {
    const existing = { id: 1, childId: 5, classId: null };
    const updated = { id: 1, title: 'Updated Report Card', childId: 5, classId: null };
    dbMock.select
      .mockReturnValueOnce(makeChain([existing]))
      .mockReturnValueOnce(makeChain([{ id: 1 }]))
      .mockReturnValueOnce(makeChain([{ id: 1 }]));
    dbMock.update.mockReturnValueOnce(makeChain([updated]));

    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }))
      .send(validUpdate);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  test('403 when a parent tries to edit a document belonging to a different child', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 1, childId: 99, classId: null }]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }))
      .send(validUpdate);

    expect(res.status).toBe(403);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test("400 when moving to a child_id + class_id combination where the child isn't in that class", async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 1, childId: 5, classId: null }]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validUpdate, class_id: 3 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Child is not assigned to this class' });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  test('200 on success', async () => {
    const updated = { id: 1, title: 'Updated Report Card', childId: 5, classId: null };
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 1, childId: 5, classId: null }]));
    dbMock.update.mockReturnValueOnce(makeChain([updated]));

    const res = await request(app)
      .put('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validUpdate);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });
});
