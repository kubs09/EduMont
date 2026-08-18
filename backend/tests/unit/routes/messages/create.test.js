import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { transaction: jest.fn() };
const mailMock = { sendEmail: jest.fn() };

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: mailMock,
  sendEmail: mailMock.sendEmail,
}));

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const makeTxMock = () => ({ execute: jest.fn(), select: jest.fn(), insert: jest.fn() });

const validMessage = { to_user_ids: [2], subject: 'Hi', content: 'Hello there' };

describe('POST /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/messages').send(validMessage);

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 when to_user_ids contains an id outside the allowed set', async () => {
    const tx = makeTxMock();
    tx.execute.mockResolvedValueOnce({ rows: [{ id: 2 }, { id: 3 }] });
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ to_user_ids: [999], subject: 'Hi', content: 'Hello there' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Some recipients are not allowed' });
    expect(tx.insert).not.toHaveBeenCalled();
    expect(mailMock.sendEmail).not.toHaveBeenCalled();
  });

  test('201 sending to a single recipient', async () => {
    const tx = makeTxMock();
    const insertedMessage = {
      id: 10,
      to_user_id: 2,
      from_user_id: 1,
      subject: 'Hi',
      content: 'Hello there',
    };
    tx.execute.mockResolvedValueOnce({ rows: [{ id: 2 }] });
    tx.select
      .mockReturnValueOnce(makeChain([{ firstname: 'Ada', surname: 'Lovelace' }]))
      .mockReturnValueOnce(
        makeChain([{ id: 2, email: 'r2@example.com', messageNotifications: false }])
      );
    tx.insert.mockReturnValueOnce(makeChain([insertedMessage]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validMessage);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(insertedMessage);
  });

  test('201 sending to multiple recipients, one row per recipient sharing subject/content', async () => {
    const tx = makeTxMock();
    const insertedMessages = [
      { id: 10, to_user_id: 2, from_user_id: 1, subject: 'Hi', content: 'Hello there' },
      { id: 11, to_user_id: 3, from_user_id: 1, subject: 'Hi', content: 'Hello there' },
    ];
    tx.execute.mockResolvedValueOnce({ rows: [{ id: 2 }, { id: 3 }] });
    const insertChain = makeChain(insertedMessages);
    tx.select
      .mockReturnValueOnce(makeChain([{ firstname: 'Ada', surname: 'Lovelace' }]))
      .mockReturnValueOnce(
        makeChain([
          { id: 2, email: 'r2@example.com', messageNotifications: false },
          { id: 3, email: 'r3@example.com', messageNotifications: false },
        ])
      );
    tx.insert.mockReturnValueOnce(insertChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ to_user_ids: [2, 3], subject: 'Hi', content: 'Hello there' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(insertedMessages[0]);
    expect(insertChain.values).toHaveBeenCalledWith([
      { fromUserId: 1, toUserId: 2, subject: 'Hi', content: 'Hello there' },
      { fromUserId: 1, toUserId: 3, subject: 'Hi', content: 'Hello there' },
    ]);
  });

  test('notification email sent only to recipients with messageNotifications true, with the sender name interpolated', async () => {
    const tx = makeTxMock();
    const insertedMessages = [
      { id: 10, to_user_id: 2, from_user_id: 1, subject: 'Hi', content: 'Hello there' },
      { id: 11, to_user_id: 3, from_user_id: 1, subject: 'Hi', content: 'Hello there' },
    ];
    tx.execute.mockResolvedValueOnce({ rows: [{ id: 2 }, { id: 3 }] });
    tx.select
      .mockReturnValueOnce(makeChain([{ firstname: 'Ada', surname: 'Lovelace' }]))
      .mockReturnValueOnce(
        makeChain([
          { id: 2, email: 'notify-off@example.com', messageNotifications: false },
          { id: 3, email: 'notify-on@example.com', messageNotifications: true },
        ])
      );
    tx.insert.mockReturnValueOnce(makeChain(insertedMessages));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send({ to_user_ids: [2, 3], subject: 'Hi', content: 'Hello there' });

    expect(res.status).toBe(201);
    expect(mailMock.sendEmail).toHaveBeenCalledTimes(1);
    expect(mailMock.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'notify-on@example.com',
        html: expect.stringContaining('Ada Lovelace'),
      })
    );
  });

  test('500 when the transaction throws an unexpected error', async () => {
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }))
      .send(validMessage);

    expect(res.status).toBe(500);
  });
});
