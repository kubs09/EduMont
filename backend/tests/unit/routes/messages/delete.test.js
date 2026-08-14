import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { transaction: jest.fn() };

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

const makeTxMock = () => ({ select: jest.fn(), update: jest.fn() });

describe('DELETE /api/messages/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).delete('/api/messages/1');

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test("404 when the message doesn't exist", async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/messages/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(404);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test('404 when the caller is neither sender nor recipient', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/messages/1')
      .set('Authorization', authHeader({ id: 5, role: 'admin' }));

    expect(res.status).toBe(404);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test('sets deletedBySender when the caller is the sender', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ fromUserId: 1 }]));
    const updateChain = makeChain([]);
    tx.update.mockReturnValueOnce(updateChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/messages/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(204);
    expect(updateChain.set).toHaveBeenCalledWith({ deletedBySender: true });
  });

  test('sets deletedByRecipient when the caller is the recipient', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ fromUserId: 5 }]));
    const updateChain = makeChain([]);
    tx.update.mockReturnValueOnce(updateChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/messages/1')
      .set('Authorization', authHeader({ id: 2, role: 'parent' }));

    expect(res.status).toBe(204);
    expect(updateChain.set).toHaveBeenCalledWith({ deletedByRecipient: true });
  });

  test('204 with an empty body on success', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ fromUserId: 1 }]));
    tx.update.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .delete('/api/messages/1')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(res.text).toBe('');
  });
});
