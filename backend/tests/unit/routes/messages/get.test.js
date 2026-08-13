import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { execute: jest.fn(), update: jest.fn() };

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

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const messageRow = (overrides = {}) => ({
  id: 1,
  subject: 'Hi',
  content: 'Hello there',
  from_user_id: 1,
  to_user_id: 2,
  created_at: '2026-01-01T00:00:00.000Z',
  read_at: null,
  deleted_by_sender: false,
  deleted_by_recipient: false,
  from_user: { firstname: 'Ada', surname: 'Lovelace', email: 'ada@example.com' },
  to_user: { firstname: 'Grace', surname: 'Hopper', email: 'grace@example.com' },
  recipients: [{ id: 2, firstname: 'Grace', surname: 'Hopper', email: 'grace@example.com' }],
  ...overrides,
});

describe('messages routes: get', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/messages');

    expect(res.status).toBe(401);
    expect(dbMock.execute).not.toHaveBeenCalled();
  });

  describe('GET /api/messages', () => {
    test('200 returning result.rows verbatim', async () => {
      const rows = [messageRow(), messageRow({ id: 2 })];
      dbMock.execute.mockResolvedValueOnce({ rows });

      const res = await request(app)
        .get('/api/messages')
        .set('Authorization', authHeader({ id: 2, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(rows);
    });
  });

  describe('GET /api/messages/:id', () => {
    test("404 when result.rows is empty", async () => {
      dbMock.execute.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/messages/999')
        .set('Authorization', authHeader({ id: 2, role: 'parent' }));

      expect(res.status).toBe(404);
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    test('200 and a readAt update when the caller is the recipient and read_at is null', async () => {
      const row = messageRow({ to_user_id: 2, read_at: null });
      dbMock.execute.mockResolvedValueOnce({ rows: [row] });
      dbMock.update.mockReturnValueOnce(makeChain(undefined));

      const res = await request(app)
        .get('/api/messages/1')
        .set('Authorization', authHeader({ id: 2, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(row);
      expect(dbMock.update).toHaveBeenCalledTimes(1);
    });

    test('no update when the caller is the sender', async () => {
      const row = messageRow({ from_user_id: 1, to_user_id: 2, read_at: null });
      dbMock.execute.mockResolvedValueOnce({ rows: [row] });

      const res = await request(app)
        .get('/api/messages/1')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(row);
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    test('no update when read_at is already set', async () => {
      const row = messageRow({ to_user_id: 2, read_at: '2026-01-02T00:00:00.000Z' });
      dbMock.execute.mockResolvedValueOnce({ rows: [row] });

      const res = await request(app)
        .get('/api/messages/1')
        .set('Authorization', authHeader({ id: 2, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(row);
      expect(dbMock.update).not.toHaveBeenCalled();
    });
  });
});
