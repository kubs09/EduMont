import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), update: jest.fn(), transaction: jest.fn() };

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

describe('GET /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('200 with an unfiltered list for an admin caller', async () => {
    const chain = makeChain([
      { id: 1, firstname: 'A', surname: 'B', email: 'a@example.com', role: 'admin' },
    ]);
    dbMock.select.mockReturnValueOnce(chain);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(chain.where).not.toHaveBeenCalled();
  });

  test('200 with a role-filtered list for an admin caller', async () => {
    const chain = makeChain([]);
    dbMock.select.mockReturnValueOnce(chain);

    const res = await request(app)
      .get('/api/users?role=teacher')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(chain.where).toHaveBeenCalledTimes(1);
  });

  test('200 with an unfiltered list for a teacher caller', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', authHeader({ id: 2, role: 'teacher' }));

    expect(res.status).toBe(200);
  });

  test('200 with an unfiltered list for a parent caller', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', authHeader({ id: 3, role: 'parent' }));

    expect(res.status).toBe(200);
  });
});

describe('GET /api/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/users/1');

    expect(res.status).toBe(401);
  });

  test('400 for a non-numeric id', async () => {
    const res = await request(app)
      .get('/api/users/abc')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(400);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('404 when the target user does not exist', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/users/999')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(404);
  });

  test('200 when viewing self', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([
        {
          id: 1,
          firstname: 'A',
          surname: 'B',
          email: 'a@example.com',
          role: 'parent',
          phone: null,
        },
      ])
    );

    const res = await request(app)
      .get('/api/users/1')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }));

    expect(res.status).toBe(200);
  });

  test('200 when an admin views anyone', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([
        {
          id: 5,
          firstname: 'A',
          surname: 'B',
          email: 'a@example.com',
          role: 'teacher',
          phone: null,
        },
      ])
    );

    const res = await request(app)
      .get('/api/users/5')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
  });

  test('200 when a parent views a teacher', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([
        {
          id: 5,
          firstname: 'A',
          surname: 'B',
          email: 'a@example.com',
          role: 'teacher',
          phone: null,
        },
      ])
    );

    const res = await request(app)
      .get('/api/users/5')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }));

    expect(res.status).toBe(200);
  });

  test('200 when a teacher views a parent', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([
        {
          id: 5,
          firstname: 'A',
          surname: 'B',
          email: 'a@example.com',
          role: 'parent',
          phone: null,
        },
      ])
    );

    const res = await request(app)
      .get('/api/users/5')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

    expect(res.status).toBe(200);
  });

  test('200 when a teacher views another teacher', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([
        {
          id: 5,
          firstname: 'A',
          surname: 'B',
          email: 'a@example.com',
          role: 'teacher',
          phone: null,
        },
      ])
    );

    const res = await request(app)
      .get('/api/users/5')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

    expect(res.status).toBe(200);
  });

  test('200 when a parent views another parent sharing a child', async () => {
    dbMock.select
      .mockReturnValueOnce(
        makeChain([
          {
            id: 5,
            firstname: 'A',
            surname: 'B',
            email: 'a@example.com',
            role: 'parent',
            phone: null,
          },
        ])
      )
      .mockReturnValueOnce(makeChain([{ id: 42 }]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/users/5')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }));

    expect(res.status).toBe(200);
  });

  test('403 when a parent views another parent without a shared child', async () => {
    dbMock.select
      .mockReturnValueOnce(
        makeChain([
          {
            id: 5,
            firstname: 'A',
            surname: 'B',
            email: 'a@example.com',
            role: 'parent',
            phone: null,
          },
        ])
      )
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/api/users/5')
      .set('Authorization', authHeader({ id: 1, role: 'parent' }));

    expect(res.status).toBe(403);
  });

  test('403 for any other disallowed role combination', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([
        { id: 5, firstname: 'A', surname: 'B', email: 'a@example.com', role: 'admin', phone: null },
      ])
    );

    const res = await request(app)
      .get('/api/users/5')
      .set('Authorization', authHeader({ id: 1, role: 'teacher' }));

    expect(res.status).toBe(403);
  });
});
