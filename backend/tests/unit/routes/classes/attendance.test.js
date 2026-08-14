import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { makeChain } from '../../../helpers/drizzleMock.js';
import { signTestToken } from '../../../helpers/auth.js';

const dbMock = { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };

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

describe('classes routes: attendance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/classes/1/attendance');

    expect(res.status).toBe(401);
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  describe('GET /api/classes/:id/attendance', () => {
    test('400 for a non-numeric class id', async () => {
      const res = await request(app)
        .get('/api/classes/abc/attendance')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a non-numeric child_id query param when provided', async () => {
      const res = await request(app)
        .get('/api/classes/1/attendance?child_id=abc')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for a malformed date query param', async () => {
      const res = await request(app)
        .get('/api/classes/1/attendance?date=01-10-2026')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a teacher without class access', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/classes/1/attendance')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('400 for a parent without child_id', async () => {
      const res = await request(app)
        .get('/api/classes/1/attendance')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a parent without access to that child/class', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .get('/api/classes/1/attendance?child_id=3')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('403 for an unrecognized role', async () => {
      const res = await request(app)
        .get('/api/classes/1/attendance')
        .set('Authorization', authHeader({ id: 1, role: 'bogus' }));

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    const attendanceRow = {
      id: 3,
      firstname: 'Ada',
      surname: 'Lovelace',
      attendance_date: '2026-01-10',
      check_in_at: '2026-01-10T08:00:00.000Z',
      check_out_at: null,
    };

    test('200 for admin', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([attendanceRow]));

      const res = await request(app)
        .get('/api/classes/1/attendance')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([attendanceRow]);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('200 for a teacher with access', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 1 }]))
        .mockReturnValueOnce(makeChain([attendanceRow]));

      const res = await request(app)
        .get('/api/classes/1/attendance')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([attendanceRow]);
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });

    test('200 for a parent with access', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 1 }]))
        .mockReturnValueOnce(makeChain([attendanceRow]));

      const res = await request(app)
        .get('/api/classes/1/attendance?child_id=3')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([attendanceRow]);
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /api/classes/:id/attendance/check-in', () => {
    const validBody = { child_id: 3, attendance_date: '2026-01-10', check_in_at: '2026-01-10T08:00:00.000Z' };

    test('400 for invalid class id', async () => {
      const res = await request(app)
        .post('/api/classes/abc/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for missing/invalid child_id', async () => {
      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ ...validBody, child_id: undefined });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for invalid attendance_date', async () => {
      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ ...validBody, attendance_date: '01-10-2026' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for invalid check_in_at', async () => {
      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ ...validBody, check_in_at: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a teacher without class access', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
        .send(validBody);

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('403 for a parent without access to that child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validBody);

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('403 for an unrecognized role', async () => {
      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'bogus' }))
        .send(validBody);

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('404 when the child is not linked to the class', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(404);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('409 when already checked in for that date', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 1 }])) // isChildInClass
        .mockReturnValueOnce(makeChain([{ id: 5, checkInAt: '2026-01-10T08:00:00.000Z' }])); // existing

      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(409);
      expect(dbMock.insert).not.toHaveBeenCalled();
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    test('201 creating a new attendance row when none exists yet for that date', async () => {
      const created = { id: 5, classId: 1, childId: 3, attendanceDate: '2026-01-10', checkInAt: validBody.check_in_at };
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 1 }])) // isChildInClass
        .mockReturnValueOnce(makeChain([])); // existing - none
      dbMock.insert.mockReturnValueOnce(makeChain([created]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    test('200 updating the existing row when one exists for that date but has no check_in_at', async () => {
      const updated = { id: 5, classId: 1, childId: 3, attendanceDate: '2026-01-10', checkInAt: validBody.check_in_at };
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 1 }])) // isChildInClass
        .mockReturnValueOnce(makeChain([{ id: 5, checkInAt: null }])); // existing without check-in
      dbMock.update.mockReturnValueOnce(makeChain([updated]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-in')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(dbMock.insert).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/classes/:id/attendance/check-out', () => {
    const validBody = { child_id: 3, attendance_date: '2026-01-10', check_out_at: '2026-01-10T17:00:00.000Z' };

    test('400 for invalid class id', async () => {
      const res = await request(app)
        .post('/api/classes/abc/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for missing/invalid child_id', async () => {
      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ ...validBody, child_id: undefined });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for invalid attendance_date', async () => {
      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ ...validBody, attendance_date: '01-10-2026' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for invalid check_out_at', async () => {
      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ ...validBody, check_out_at: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 for a teacher without class access', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
        .send(validBody);

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('403 for a parent without access to that child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 7, role: 'parent' }))
        .send(validBody);

      expect(res.status).toBe(403);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('403 for an unrecognized role', async () => {
      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'bogus' }))
        .send(validBody);

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('404 when the child is not linked to the class', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(404);
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    test('409 when not checked in yet for that date', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 1 }])) // isChildInClass
        .mockReturnValueOnce(makeChain([])); // existing - none

      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(409);
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    test('409 when already checked out', async () => {
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 1 }])) // isChildInClass
        .mockReturnValueOnce(
          makeChain([
            {
              id: 5,
              checkInAt: '2026-01-10T08:00:00.000Z',
              checkOutAt: '2026-01-10T17:00:00.000Z',
            },
          ])
        ); // existing - already checked out

      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(409);
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    test('200 on successful check-out', async () => {
      const updated = {
        id: 5,
        classId: 1,
        childId: 3,
        attendanceDate: '2026-01-10',
        checkInAt: '2026-01-10T08:00:00.000Z',
        checkOutAt: validBody.check_out_at,
      };
      dbMock.select
        .mockReturnValueOnce(makeChain([{ classId: 1 }])) // isChildInClass
        .mockReturnValueOnce(
          makeChain([{ id: 5, checkInAt: '2026-01-10T08:00:00.000Z', checkOutAt: null }])
        ); // existing - checked in, not checked out
      dbMock.update.mockReturnValueOnce(makeChain([updated]));

      const res = await request(app)
        .post('/api/classes/1/attendance/check-out')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send(validBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
    });
  });
});
