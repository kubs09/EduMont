import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn() };

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

describe('GET /api/presentations/class/:id/next-presentations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/presentations/class/5/next-presentations');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('403 for a teacher not teaching the class', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([])); // teacherClassResult, empty

    const res = await request(app)
      .get('/api/presentations/class/5/next-presentations')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

    expect(res.status).toBe(403);
  });

  test('403 for a role that is neither admin, teacher, nor parent', async () => {
    const res = await request(app)
      .get('/api/presentations/class/5/next-presentations')
      .set('Authorization', authHeader({ id: 1, role: 'unknown' }));

    expect(res.status).toBe(403);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  test('200 empty array for a parent with no child in the class', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([])) // outer parentChildResult query
      .mockReturnValueOnce(makeChain([])); // exists() subquery built while constructing the where clause

    const res = await request(app)
      .get('/api/presentations/class/5/next-presentations')
      .set('Authorization', authHeader({ id: 4, role: 'parent' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('200 filtered results for an admin', async () => {
    const mainChain = makeChain([{ id: 1, name: 'Pouring', status: 'to be presented' }]);
    dbMock.select.mockReturnValueOnce(mainChain);

    const res = await request(app)
      .get('/api/presentations/class/5/next-presentations')
      .set('Authorization', authHeader({ id: 1, role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'Pouring', status: 'to be presented' }]);
  });

  test('200 filtered results for a teacher who teaches the class', async () => {
    const mainChain = makeChain([{ id: 2, name: 'Sorting', status: 'to be presented' }]);
    dbMock.select
      .mockReturnValueOnce(makeChain([{ classId: 5 }])) // teacherClassResult, non-empty
      .mockReturnValueOnce(mainChain);

    const res = await request(app)
      .get('/api/presentations/class/5/next-presentations')
      .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 2, name: 'Sorting', status: 'to be presented' }]);
  });

  test('200 filtered results for a parent with a child in the class', async () => {
    const mainChain = makeChain([{ id: 3, name: 'Scooping', status: 'to be presented' }]);
    dbMock.select
      .mockReturnValueOnce(makeChain([{ classId: 5 }])) // outer parentChildResult query, non-empty
      .mockReturnValueOnce(makeChain([])) // exists() subquery inside that access check's where clause
      .mockReturnValueOnce(makeChain([])) // exists() subquery added to the results-query conditions
      .mockReturnValueOnce(mainChain); // the results query itself

    const res = await request(app)
      .get('/api/presentations/class/5/next-presentations')
      .set('Authorization', authHeader({ id: 4, role: 'parent' }));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 3, name: 'Scooping', status: 'to be presented' }]);
  });
});
