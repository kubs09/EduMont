import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { transaction: jest.fn() };
const realtimeMock = { publishEvent: jest.fn() };

jest.unstable_mockModule('#backend/config/mail.js', () => ({
  __esModule: true,
  default: { sendEmail: jest.fn() },
  sendEmail: jest.fn(),
}));

jest.unstable_mockModule('#backend/utils/realtime.js', () => ({
  __esModule: true,
  publishEvent: realtimeMock.publishEvent,
}));

jest.unstable_mockModule('#backend/config/database.js', () => ({
  __esModule: true,
  default: { query: jest.fn() },
  db: dbMock,
}));

const { default: app } = await import('#backend/server.js');

const authHeader = (user) => `Bearer ${signTestToken(user)}`;

const makeTxMock = () => ({
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  insert: jest.fn(),
});

describe('POST /api/permissions/accept', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/permissions/accept').send({ class_id: 1 });

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-integer class_id', async () => {
    const res = await request(app)
      .post('/api/permissions/accept')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'class_id must be a positive integer' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a missing class_id', async () => {
    const res = await request(app)
      .post('/api/permissions/accept')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'class_id must be a positive integer' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 when the caller is not a teacher on the class', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/accept')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5 });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: 'You do not have permission to approve requests for this class',
    });
    expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
  });

  test('404 when there is no pending permission request for the class', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ classId: 5 }])).mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/accept')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No pending permission request found for this class' });
    expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
  });

  test('200 sets granted true and sends an English notification message by default', async () => {
    const tx = makeTxMock();
    tx.select
      .mockReturnValueOnce(makeChain([{ classId: 5 }])) // approverCheck
      .mockReturnValueOnce(makeChain([{ adminId: 9, firstname: 'Ada', surname: 'Lovelace' }])) // permissionCheck
      .mockReturnValueOnce(makeChain([{ name: 'Sunflowers' }])); // classResult
    tx.update.mockReturnValueOnce(makeChain([]));
    const insertChain = makeChain([]);
    tx.insert.mockReturnValueOnce(insertChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/accept')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Permission request accepted successfully' });
    expect(insertChain.values).toHaveBeenCalledWith({
      fromUserId: 1,
      toUserId: 9,
      subject: 'Your permission request for class "Sunflowers" has been accepted',
      content:
        'Your permission request for presentations in class "Sunflowers" has been accepted. You now have access to presentations.',
    });
    expect(realtimeMock.publishEvent).toHaveBeenCalledWith('user:9', 'permission_decided', {
      classId: 5,
    });
  });

  test('200 sends a Czech notification message when language is cs', async () => {
    const tx = makeTxMock();
    tx.select
      .mockReturnValueOnce(makeChain([{ classId: 5 }]))
      .mockReturnValueOnce(makeChain([{ adminId: 9, firstname: 'Ada', surname: 'Lovelace' }]))
      .mockReturnValueOnce(makeChain([{ name: 'Sunflowers' }]));
    tx.update.mockReturnValueOnce(makeChain([]));
    const insertChain = makeChain([]);
    tx.insert.mockReturnValueOnce(insertChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/accept')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5, language: 'cs' });

    expect(res.status).toBe(200);
    expect(insertChain.values).toHaveBeenCalledWith({
      fromUserId: 1,
      toUserId: 9,
      subject: 'Vaše žádost o oprávnění pro třídu "Sunflowers" byla přijata',
      content:
        'Vaše žádost o oprávnění k prezentacím pro třídu "Sunflowers" byla přijata. Nyní máte přístup k prezentacím.',
    });
  });

  test('500 when the transaction throws an unexpected error', async () => {
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/api/permissions/accept')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5 });

    expect(res.status).toBe(500);
  });
});

describe('POST /api/permissions/deny', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).post('/api/permissions/deny').send({ class_id: 1 });

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-integer class_id', async () => {
    const res = await request(app)
      .post('/api/permissions/deny')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'class_id must be a positive integer' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a missing class_id', async () => {
    const res = await request(app)
      .post('/api/permissions/deny')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'class_id must be a positive integer' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 when the caller is not a teacher on the class', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/deny')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5 });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: 'You do not have permission to deny requests for this class',
    });
    expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
  });

  test('404 when there is no pending permission request for the class', async () => {
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ classId: 5 }])).mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/deny')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No pending permission request found for this class' });
    expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
  });

  test('200 deletes the row and sends an English notification message by default', async () => {
    const tx = makeTxMock();
    tx.select
      .mockReturnValueOnce(makeChain([{ classId: 5 }]))
      .mockReturnValueOnce(makeChain([{ adminId: 9, firstname: 'Ada', surname: 'Lovelace' }]))
      .mockReturnValueOnce(makeChain([{ name: 'Sunflowers' }]));
    tx.delete.mockReturnValueOnce(makeChain([]));
    const insertChain = makeChain([]);
    tx.insert.mockReturnValueOnce(insertChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/deny')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Permission request denied successfully' });
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith({
      fromUserId: 1,
      toUserId: 9,
      subject: 'Your permission request for class "Sunflowers" has been denied',
      content: 'Your permission request for presentations in class "Sunflowers" has been denied.',
    });
    expect(realtimeMock.publishEvent).toHaveBeenCalledWith('user:9', 'permission_decided', {
      classId: 5,
    });
  });

  test('200 sends a Czech notification message when language is cs', async () => {
    const tx = makeTxMock();
    tx.select
      .mockReturnValueOnce(makeChain([{ classId: 5 }]))
      .mockReturnValueOnce(makeChain([{ adminId: 9, firstname: 'Ada', surname: 'Lovelace' }]))
      .mockReturnValueOnce(makeChain([{ name: 'Sunflowers' }]));
    tx.delete.mockReturnValueOnce(makeChain([]));
    const insertChain = makeChain([]);
    tx.insert.mockReturnValueOnce(insertChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/deny')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5, language: 'cs' });

    expect(res.status).toBe(200);
    expect(insertChain.values).toHaveBeenCalledWith({
      fromUserId: 1,
      toUserId: 9,
      subject: 'Vaše žádost o oprávnění pro třídu "Sunflowers" byla zamítnuta',
      content: 'Vaše žádost o oprávnění k prezentacím pro třídu "Sunflowers" byla zamítnuta.',
    });
  });

  test('500 when the transaction throws an unexpected error', async () => {
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/api/permissions/deny')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }))
      .send({ class_id: 5 });

    expect(res.status).toBe(500);
  });
});
