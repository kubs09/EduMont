import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
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

const validBody = {
  fileName: 'Report Card.pdf',
  fileType: 'application/pdf',
  childId: '5',
};

describe('POST /api/documents/upload-url', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/documents/upload-url').send(validBody);

    expect(res.status).toBe(401);
  });

  test('400 for a missing fileName', async () => {
    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, fileName: undefined });

    expect(res.status).toBe(400);
  });

  test('400 for a blank fileName', async () => {
    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, fileName: '   ' });

    expect(res.status).toBe(400);
  });

  test('400 for a missing fileType', async () => {
    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, fileType: undefined });

    expect(res.status).toBe(400);
  });

  test('400 for a blank fileType', async () => {
    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, fileType: '   ' });

    expect(res.status).toBe(400);
  });

  test('400 when neither childId nor classId is provided', async () => {
    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ fileName: validBody.fileName, fileType: validBody.fileType });

    expect(res.status).toBe(400);
  });

  test('400 for an id containing characters outside [A-Za-z0-9_-]', async () => {
    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, childId: '5/../etc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid childId or classId format' });
  });

  test('400 for a filename that sanitizes down to an empty base name', async () => {
    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, fileName: '###.pdf' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid file name after sanitization' });
  });

  test('500 when the mocked Supabase client returns an error from createSignedUploadUrl', async () => {
    supabaseMock.storage
      .from()
      .createSignedUploadUrl.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Failed to generate upload URL',
      details: 'boom',
    });
  });

  test('200 on success with childId: uses a child-{id}/... path prefix', async () => {
    supabaseMock.storage.from().createSignedUploadUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://signed.example.com/upload', token: 'tok-123' },
      error: null,
    });

    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.filePath).toMatch(/^child-5\//);
    expect(res.body.uploadUrl).toBe('https://signed.example.com/upload');
    expect(res.body.token).toBe('tok-123');
  });

  test('200 on success with only classId: uses a class-{id}/... path prefix', async () => {
    supabaseMock.storage.from().createSignedUploadUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://signed.example.com/upload', token: 'tok-456' },
      error: null,
    });

    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ fileName: validBody.fileName, fileType: validBody.fileType, classId: '3' });

    expect(res.status).toBe(200);
    expect(res.body.filePath).toMatch(/^class-3\//);
  });

  test('200 on success: childId takes priority when both childId and classId are given', async () => {
    supabaseMock.storage.from().createSignedUploadUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://signed.example.com/upload', token: 'tok-789' },
      error: null,
    });

    const res = await request(app)
      .post('/api/documents/upload-url')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ ...validBody, classId: '3' });

    expect(res.status).toBe(200);
    expect(res.body.filePath).toMatch(/^child-5\//);
  });
});
