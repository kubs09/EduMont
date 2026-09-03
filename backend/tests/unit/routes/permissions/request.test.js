import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), transaction: jest.fn() };
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

const makeTxMock = () => ({ select: jest.fn(), insert: jest.fn() });

describe('GET /api/permissions/check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/permissions/check').query({ resource_id: 5 });

    expect(res.status).toBe(401);
  });

  test('400 for a non-integer resource_id', async () => {
    const res = await request(app)
      .get('/api/permissions/check')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .query({ resource_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'resource_id must be a positive integer' });
  });

  test('403 for a non-admin caller', async () => {
    const res = await request(app)
      .get('/api/permissions/check')
      .set('Authorization', authHeader({ id: 10, role: 'teacher' }))
      .query({ resource_id: 5 });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only admins can check permission requests' });
  });

  test('404 when the class does not exist', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/permissions/check')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .query({ resource_id: 5 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Class not found' });
  });

  test('200 already_requested: false when there is no pending request', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/permissions/check')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .query({ resource_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ already_requested: false });
  });

  test('200 already_requested: true when a request is pending', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }]))
      .mockReturnValueOnce(makeChain([{ id: 1 }]));

    const res = await request(app)
      .get('/api/permissions/check')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .query({ resource_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ already_requested: true });
  });
});

describe('GET /api/permissions/granted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/permissions/granted').query({ resource_id: 5 });

    expect(res.status).toBe(401);
  });

  test('400 for a non-integer resource_id', async () => {
    const res = await request(app)
      .get('/api/permissions/granted')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .query({ resource_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'resource_id must be a positive integer' });
  });

  test('403 for a non-admin caller', async () => {
    const res = await request(app)
      .get('/api/permissions/granted')
      .set('Authorization', authHeader({ id: 10, role: 'teacher' }))
      .query({ resource_id: 5 });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only admins can check presentation permissions' });
  });

  test('200 has_access: false when there is no permission row', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/permissions/granted')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .query({ resource_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ has_access: false });
  });

  test('200 has_access: true when the permission row has granted true', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ granted: true }]));

    const res = await request(app)
      .get('/api/permissions/granted')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .query({ resource_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ has_access: true });
  });
});

describe('GET /api/permissions/pending', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/permissions/pending').query({ class_id: 5 });

    expect(res.status).toBe(401);
  });

  test('400 for a non-integer class_id', async () => {
    const res = await request(app)
      .get('/api/permissions/pending')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .query({ class_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'class_id must be a positive integer' });
  });

  test('403 when the caller is neither admin nor a teacher on the class', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/permissions/pending')
      .set('Authorization', authHeader({ id: 40, role: 'teacher' }))
      .query({ class_id: 5 });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'You do not have access to this class' });
  });

  test('200 with pending requests for an admin caller', async () => {
    const pendingRow = {
      id: 1,
      admin_id: 10,
      class_id: 5,
      permission_requested: true,
      granted: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      firstname: 'Ada',
      surname: 'Lovelace',
      email: 'ada@example.com',
    };
    dbMock.select.mockReturnValueOnce(makeChain([])).mockReturnValueOnce(makeChain([pendingRow]));

    const res = await request(app)
      .get('/api/permissions/pending')
      .set('Authorization', authHeader({ id: 99, role: 'admin' }))
      .query({ class_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ has_pending: true, requests: [pendingRow] });
  });

  test('200 with pending requests for a teacher-of-class caller', async () => {
    const pendingRow = {
      id: 1,
      admin_id: 10,
      class_id: 5,
      permission_requested: true,
      granted: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      firstname: 'Ada',
      surname: 'Lovelace',
      email: 'ada@example.com',
    };
    dbMock.select
      .mockReturnValueOnce(makeChain([{ classId: 5 }]))
      .mockReturnValueOnce(makeChain([pendingRow]));

    const res = await request(app)
      .get('/api/permissions/pending')
      .set('Authorization', authHeader({ id: 30, role: 'teacher' }))
      .query({ class_id: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ has_pending: true, requests: [pendingRow] });
  });
});

describe('POST /api/permissions/request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBody = { resource_id: 5 };

  test('401 without a token', async () => {
    const res = await request(app).post('/api/permissions/request').send(validBody);

    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('400 for a non-integer resource_id', async () => {
    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send({ resource_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'resource_id must be a positive integer' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('403 for a non-admin caller', async () => {
    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'teacher' }))
      .send(validBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only admins can request permissions' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('404 when the requester does not exist', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Requester not found' });
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  test('404 when the class does not exist', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ firstname: 'Ada', surname: 'Lovelace', email: 'ada@example.com' }])
    );
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Class not found' });
    expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
  });

  test('200 already_requested: true when a request is already pending, with no message insert', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ firstname: 'Ada', surname: 'Lovelace', email: 'ada@example.com' }])
    );
    const tx = makeTxMock();
    tx.select
      .mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }]))
      .mockReturnValueOnce(
        makeChain([{ id: 20, firstname: 'T', surname: 'One', email: 't1@example.com' }])
      );
    tx.insert.mockReturnValueOnce(makeChain([]));
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Permission request already exists and is pending',
      already_requested: true,
    });
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
  });

  test('201 with one message per teacher on the class', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ firstname: 'Ada', surname: 'Lovelace', email: 'ada@example.com' }])
    );
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }])).mockReturnValueOnce(
      makeChain([
        { id: 20, firstname: 'T', surname: 'One', email: 't1@example.com', class_role: 'teacher' },
        { id: 21, firstname: 'T', surname: 'Two', email: 't2@example.com', class_role: 'teacher' },
      ])
    );
    const messagesChain = makeChain([]);
    tx.insert.mockReturnValueOnce(makeChain([{ id: 1 }])).mockReturnValueOnce(messagesChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'Permission request sent successfully',
      recipients_count: 2,
      already_requested: false,
    });
    expect(messagesChain.values).toHaveBeenCalledWith([
      {
        fromUserId: 10,
        toUserId: 20,
        subject: 'Permission Request',
        content: expect.stringContaining(
          'Administrator Ada Lovelace (ada@example.com) has requested permission to access presentations.\n\nClass: Sunflowers'
        ),
      },
      {
        fromUserId: 10,
        toUserId: 21,
        subject: 'Permission Request',
        content: expect.stringContaining(
          'Administrator Ada Lovelace (ada@example.com) has requested permission to access presentations.\n\nClass: Sunflowers'
        ),
      },
    ]);
    expect(realtimeMock.publishEvent).toHaveBeenCalledWith('class:5', 'permission_requested', {
      classId: 5,
    });
  });

  test('201 with resource_type and reason included in the message content', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ firstname: 'Ada', surname: 'Lovelace', email: 'ada@example.com' }])
    );
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }])).mockReturnValueOnce(
      makeChain([
        { id: 20, firstname: 'T', surname: 'One', email: 't1@example.com', class_role: 'teacher' },
        { id: 21, firstname: 'T', surname: 'Two', email: 't2@example.com', class_role: 'teacher' },
      ])
    );
    const messagesChain = makeChain([]);
    tx.insert.mockReturnValueOnce(makeChain([{ id: 1 }])).mockReturnValueOnce(messagesChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send({
        ...validBody,
        resource_type: 'presentation',
        reason: 'Need access for parent conference',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'Permission request sent successfully',
      recipients_count: 2,
      already_requested: false,
    });
    expect(messagesChain.values).toHaveBeenCalledWith([
      {
        fromUserId: 10,
        toUserId: 20,
        subject: 'Permission Request',
        content: expect.stringContaining(
          'Resource Type: presentation\nReason: Need access for parent conference'
        ),
      },
      {
        fromUserId: 10,
        toUserId: 21,
        subject: 'Permission Request',
        content: expect.stringContaining(
          'Resource Type: presentation\nReason: Need access for parent conference'
        ),
      },
    ]);
  });

  test('201 with a [SYSTEM LOG] self-message when the class has zero teachers', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ firstname: 'Ada', surname: 'Lovelace', email: 'ada@example.com' }])
    );
    const tx = makeTxMock();
    tx.select
      .mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }]))
      .mockReturnValueOnce(makeChain([]));
    const messagesChain = makeChain([]);
    tx.insert.mockReturnValueOnce(makeChain([{ id: 1 }])).mockReturnValueOnce(messagesChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'Permission request sent successfully',
      recipients_count: 1,
      already_requested: false,
    });
    expect(messagesChain.values).toHaveBeenCalledWith({
      fromUserId: 10,
      toUserId: 10,
      subject: '[SYSTEM LOG] Permission Request',
      content: expect.stringContaining(
        'Administrator Ada Lovelace (ada@example.com) has requested permission to access presentations.\n\nClass: Sunflowers'
      ),
    });
  });

  test('uses Czech subject/content when language is cs', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ firstname: 'Ada', surname: 'Lovelace', email: 'ada@example.com' }])
    );
    const tx = makeTxMock();
    tx.select.mockReturnValueOnce(makeChain([{ id: 5, name: 'Sunflowers' }])).mockReturnValueOnce(
      makeChain([
        {
          id: 20,
          firstname: 'T',
          surname: 'One',
          email: 't1@example.com',
          class_role: 'teacher',
        },
      ])
    );
    const messagesChain = makeChain([]);
    tx.insert.mockReturnValueOnce(makeChain([{ id: 1 }])).mockReturnValueOnce(messagesChain);
    dbMock.transaction.mockImplementation((cb) => cb(tx));

    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send({ ...validBody, language: 'cs' });

    expect(res.status).toBe(201);
    expect(messagesChain.values).toHaveBeenCalledWith([
      {
        fromUserId: 10,
        toUserId: 20,
        subject: 'Žádost o oprávnění',
        content: expect.stringContaining(
          'Administrátor Ada Lovelace (ada@example.com) požádal o oprávnění k prezentacím.\n\nTřída: Sunflowers'
        ),
      },
    ]);
  });

  test('500 when the transaction throws an unexpected error', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ firstname: 'Ada', surname: 'Lovelace', email: 'ada@example.com' }])
    );
    dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app)
      .post('/api/permissions/request')
      .set('Authorization', authHeader({ id: 10, role: 'admin' }))
      .send(validBody);

    expect(res.status).toBe(500);
  });
});
