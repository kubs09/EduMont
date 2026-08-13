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

describe('DELETE /api/documents/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/documents/1');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test("404 when the document doesn't exist", async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .delete('/api/documents/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(404);
    expect(dbMock.delete).not.toHaveBeenCalled();
  });

  test("403 for an unlinked teacher", async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 1, childId: 5, classId: null, fileUrl: null }]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .delete('/api/documents/1')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

    expect(res.status).toBe(403);
    expect(dbMock.delete).not.toHaveBeenCalled();
  });

  test("403 for a parent whose child isn't this document's child", async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 1, childId: 99, classId: null, fileUrl: null }]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .delete('/api/documents/1')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }));

    expect(res.status).toBe(403);
    expect(dbMock.delete).not.toHaveBeenCalled();
  });

  test("200 when a parent linked to their own child deletes that child's document", async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 1, childId: 5, classId: null, fileUrl: null }]))
      .mockReturnValueOnce(makeChain([{ id: 1 }]));
    dbMock.delete.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .delete('/api/documents/1')
      .set('Authorization', authHeader({ id: 7, role: 'parent' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Document deleted successfully' });
    expect(dbMock.delete).toHaveBeenCalledTimes(1);
  });

  test('200 on success: storage removal is called with the path extracted from file_url', async () => {
    const fileUrl =
      'https://project.supabase.co/storage/v1/object/public/documents/child-5/1700000000-report.pdf';
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 1, childId: 5, classId: null, fileUrl }])
    );
    dbMock.delete.mockReturnValueOnce(makeChain([]));
    supabaseMock.storage.from().remove.mockResolvedValueOnce({ error: null });

    const res = await request(app)
      .delete('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(supabaseMock.storage.from).toHaveBeenCalledWith('documents');
    expect(supabaseMock.storage.from().remove).toHaveBeenCalledWith([
      'child-5/1700000000-report.pdf',
    ]);
  });

  test('200 and the DB row is deleted even when the mocked storage .remove() call errors', async () => {
    const fileUrl =
      'https://project.supabase.co/storage/v1/object/public/documents/child-5/1700000000-report.pdf';
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 1, childId: 5, classId: null, fileUrl }])
    );
    dbMock.delete.mockReturnValueOnce(makeChain([]));
    supabaseMock.storage.from().remove.mockResolvedValueOnce({ error: { message: 'boom' } });

    const res = await request(app)
      .delete('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Document deleted successfully' });
    expect(dbMock.delete).toHaveBeenCalledTimes(1);
  });

  test('no storage call is attempted when file_url is null', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 1, childId: 5, classId: null, fileUrl: null }])
    );
    dbMock.delete.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .delete('/api/documents/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(supabaseMock.storage.from).not.toHaveBeenCalled();
  });
});
