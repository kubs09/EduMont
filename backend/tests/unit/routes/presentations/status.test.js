import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import { and, asc, desc, eq, gt, lt } from 'drizzle-orm';
import { classChildren, classTeachers, presentations } from '#backend/db/schema.js';
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

const makeTxMock = () => ({ select: jest.fn(), update: jest.fn() });

// Builds a chain for the canEditChildpresentation join that captures the
// exact `where` condition it was built with, instead of ignoring arguments
// like makeChain does. This lets us prove the route queried permissions for
// the actual childId from the URL (not, say, presentationId mixed up with
// it): if the route passed the wrong id, the captured condition would not
// match the expected one and the test would fail.
const makePermissionChain = (result) => {
  let capturedCondition;
  const chain = {
    from: jest.fn(() => chain),
    innerJoin: jest.fn(() => chain),
    where: jest.fn((condition) => {
      capturedCondition = condition;
      return chain;
    }),
    limit: jest.fn(() => Promise.resolve(result)),
  };
  return { chain, getCondition: () => capturedCondition };
};

// Builds a chain for the reorder handler's adjacent-sibling lookup that
// captures the exact `where`/`orderBy` arguments it was built with, instead
// of ignoring them like makeChain does. This lets us prove the route used
// the correct comparison operator (lt+desc for "up", gt+asc for "down") and
// the correct childId/category filters for the given direction: a
// regression that used the wrong operator, wrong ordering, or dropped a
// filter would leave the mocked return value unchanged but would fail the
// captured-argument assertions.
const makeAdjacentRowChain = (result) => {
  let capturedWhere;
  let capturedOrderBy;
  const chain = {
    from: jest.fn(() => chain),
    where: jest.fn((condition) => {
      capturedWhere = condition;
      return chain;
    }),
    orderBy: jest.fn((orderByArg) => {
      capturedOrderBy = orderByArg;
      return chain;
    }),
    limit: jest.fn(() => Promise.resolve(result)),
  };
  return { chain, getWhere: () => capturedWhere, getOrderBy: () => capturedOrderBy };
};

describe('presentations status/reorder routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/presentations/children/:childId/:presentationId/status', () => {
    test('401 without a token', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .send({ status: 'mastered' });

      expect(res.status).toBe(401);
      expect(dbMock.transaction).not.toHaveBeenCalled();
    });

    test('400 for an invalid childId', async () => {
      const res = await request(app)
        .put('/api/presentations/children/abc/1/status')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ status: 'mastered' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for an invalid presentationId', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/abc/status')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ status: 'mastered' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for an invalid status value', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ status: 'not-a-status' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 when notes is not a string', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ status: 'mastered', notes: 123 });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 when notes exceeds 1000 characters', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ status: 'mastered', notes: 'a'.repeat(1001) });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 when the caller role is neither admin nor teacher', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .set('Authorization', authHeader({ id: 1, role: 'parent' }))
        .send({ status: 'mastered' });

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test("403 when the caller can't edit this child's presentations", async () => {
      // Distinct childId (5) vs presentationId (1) so a mixed-up argument
      // would produce a condition that fails the toEqual check below.
      const { chain, getCondition } = makePermissionChain([]);
      dbMock.select.mockReturnValueOnce(chain); // canEditChildpresentation join, empty

      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
        .send({ status: 'mastered' });

      expect(res.status).toBe(403);
      expect(dbMock.transaction).not.toHaveBeenCalled();
      expect(getCondition()).toEqual(
        and(eq(classTeachers.teacherId, 9), eq(classChildren.childId, 5))
      );
    });

    test('404 when the presentation is not found for this child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([])); // presentationResult, empty (admin bypasses canEdit's own select)

      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ status: 'mastered' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'presentation not found for this child' });
      expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
    });

    test('200 happy path', async () => {
      const tx = makeTxMock();
      const updatedRow = { id: 1, status: 'mastered', notes: 'Great progress this week' };

      // Hand-built update chain that captures the set() argument passed to
      // tx.update, so res.body reflects what the route actually built rather
      // than just a pre-loaded mock return. A regression that dropped a
      // field (e.g. forgot updatedBy, or passed the wrong notes value) would
      // leave the call count unchanged but would fail the assertion below.
      let capturedSet;
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1, category: null, classId: 9 }])); // presentationResult
      tx.update.mockReturnValueOnce({
        set: jest.fn((setArg) => {
          capturedSet = setArg;
          return {
            where: jest.fn(() => ({
              returning: jest.fn(() => Promise.resolve([updatedRow])),
            })),
          };
        }),
      });
      dbMock.transaction.mockImplementation((cb) => cb(tx));

      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ status: 'mastered', notes: 'Great progress this week' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedRow);
      expect(capturedSet).toEqual(
        expect.objectContaining({
          status: 'mastered',
          notes: 'Great progress this week',
          updatedBy: 1,
        })
      );
      // category was null, so normalizeCategoryOrdering no-ops.
      expect(tx.select).not.toHaveBeenCalled();
      expect(realtimeMock.publishEvent).toHaveBeenCalledWith('class:9', 'presentation_changed', {
        classId: 9,
      });
    });

    test('500 when the transaction throws an unexpected error', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([{ id: 1, category: null, classId: 9 }])); // presentationResult
      dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

      const res = await request(app)
        .put('/api/presentations/children/5/1/status')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ status: 'mastered' });

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /api/presentations/children/:childId/:presentationId/reorder', () => {
    test('401 without a token', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .send({ direction: 'up' });

      expect(res.status).toBe(401);
      expect(dbMock.transaction).not.toHaveBeenCalled();
    });

    test('400 for an invalid childId', async () => {
      const res = await request(app)
        .put('/api/presentations/children/abc/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'up' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for an invalid presentationId', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/abc/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'up' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('400 for an invalid direction', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'sideways' });

      expect(res.status).toBe(400);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test('403 when the caller role is neither admin nor teacher', async () => {
      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'parent' }))
        .send({ direction: 'up' });

      expect(res.status).toBe(403);
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    test("403 when the caller can't edit this child's presentations", async () => {
      const { chain, getCondition } = makePermissionChain([]);
      dbMock.select.mockReturnValueOnce(chain); // canEditChildpresentation join, empty

      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 9, role: 'teacher' }))
        .send({ direction: 'up' });

      expect(res.status).toBe(403);
      expect(dbMock.transaction).not.toHaveBeenCalled();
      expect(getCondition()).toEqual(
        and(eq(classTeachers.teacherId, 9), eq(classChildren.childId, 5))
      );
    });

    test('404 when the presentation is not found for this child', async () => {
      dbMock.select.mockReturnValueOnce(makeChain([])); // presentationResult, empty

      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'up' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'presentation not found for this child' });
      expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
    });

    test('400 "already at the top" when moving up with no earlier sibling', async () => {
      const tx = makeTxMock();
      dbMock.select.mockReturnValueOnce(
        makeChain([{ id: 1, category: 'Practical Life', displayOrder: 1, classId: 9 }])
      );
      const { chain, getWhere, getOrderBy } = makeAdjacentRowChain([]); // no adjacent row above
      tx.select.mockReturnValueOnce(chain);
      dbMock.transaction.mockImplementation((cb) => cb(tx));

      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'up' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Cannot move up: already at the top' });
      expect(getWhere()).toEqual(
        and(
          eq(presentations.childId, 5),
          eq(presentations.category, 'Practical Life'),
          lt(presentations.displayOrder, 1)
        )
      );
      expect(getOrderBy()).toEqual(desc(presentations.displayOrder));
      expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
    });

    test('400 "already at the bottom" when moving down with no later sibling', async () => {
      const tx = makeTxMock();
      dbMock.select.mockReturnValueOnce(
        makeChain([{ id: 1, category: 'Practical Life', displayOrder: 3, classId: 9 }])
      );
      const { chain, getWhere, getOrderBy } = makeAdjacentRowChain([]); // no adjacent row below
      tx.select.mockReturnValueOnce(chain);
      dbMock.transaction.mockImplementation((cb) => cb(tx));

      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'down' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Cannot move down: already at the bottom' });
      expect(getWhere()).toEqual(
        and(
          eq(presentations.childId, 5),
          eq(presentations.category, 'Practical Life'),
          gt(presentations.displayOrder, 3)
        )
      );
      expect(getOrderBy()).toEqual(asc(presentations.displayOrder));
      expect(realtimeMock.publishEvent).not.toHaveBeenCalled();
    });

    test('200 happy path, swapping two siblings', async () => {
      const tx = makeTxMock();
      dbMock.select.mockReturnValueOnce(
        makeChain([{ id: 1, category: 'Practical Life', displayOrder: 2, classId: 9 }])
      );
      const {
        chain: adjacentChain,
        getWhere: getAdjacentWhere,
        getOrderBy: getAdjacentOrderBy,
      } = makeAdjacentRowChain([{ id: 88 }]); // adjacent sibling found
      tx.select.mockReturnValueOnce(adjacentChain);

      // Hand-built update chain that captures the set()/where() arguments for
      // each of the two tx.update calls, so we can prove the moved
      // presentation (id 1) and its adjacent sibling (id 88) each receive the
      // correct displayOrder — not just that tx.update was called twice.
      // A regression that swapped the ids or the +/-1 offsets would leave the
      // call count unchanged but would fail the assertions below.
      const updateSetCalls = [];
      const updateWhereCalls = [];
      tx.update.mockImplementation(() => ({
        set: jest.fn((setArg) => {
          updateSetCalls.push(setArg);
          return {
            where: jest.fn((whereArg) => {
              updateWhereCalls.push(whereArg);
              return Promise.resolve([]);
            }),
          };
        }),
      }));

      dbMock.transaction.mockImplementation((cb) => cb(tx));

      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'up' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Presentation moved up' });
      // The adjacent-row lookup used lt/desc (searching for the nearest
      // sibling with a smaller displayOrder), proving the "up" branch didn't
      // regress to the "down" branch's gt/asc comparison.
      expect(getAdjacentWhere()).toEqual(
        and(
          eq(presentations.childId, 5),
          eq(presentations.category, 'Practical Life'),
          lt(presentations.displayOrder, 2)
        )
      );
      expect(getAdjacentOrderBy()).toEqual(desc(presentations.displayOrder));
      expect(tx.update).toHaveBeenCalledTimes(2);
      // Moving up: the target presentation (id 1, currently at order 2) takes
      // the adjacent sibling's slot (order 1)...
      expect(updateSetCalls[0]).toEqual(expect.objectContaining({ displayOrder: 1, updatedBy: 1 }));
      expect(updateWhereCalls[0]).toEqual(eq(presentations.id, 1));
      // ...and the adjacent sibling (id 88) takes the target's old slot (order 2).
      expect(updateSetCalls[1]).toEqual(expect.objectContaining({ displayOrder: 2, updatedBy: 1 }));
      expect(updateWhereCalls[1]).toEqual(eq(presentations.id, 88));
      expect(realtimeMock.publishEvent).toHaveBeenCalledWith('class:9', 'presentation_changed', {
        classId: 9,
      });
    });

    test('200 happy path, swapping two siblings (down direction)', async () => {
      const tx = makeTxMock();
      dbMock.select.mockReturnValueOnce(
        makeChain([{ id: 1, category: 'Practical Life', displayOrder: 2, classId: 9 }])
      );
      const {
        chain: adjacentChain,
        getWhere: getAdjacentWhere,
        getOrderBy: getAdjacentOrderBy,
      } = makeAdjacentRowChain([{ id: 88 }]); // adjacent sibling found
      tx.select.mockReturnValueOnce(adjacentChain);

      // Hand-built update chain that captures the set()/where() arguments for
      // each of the two tx.update calls, so we can prove the moved
      // presentation (id 1) and its adjacent sibling (id 88) each receive the
      // correct displayOrder for the "down" branch's offset arithmetic — not
      // just that tx.update was called twice.
      const updateSetCalls = [];
      const updateWhereCalls = [];
      tx.update.mockImplementation(() => ({
        set: jest.fn((setArg) => {
          updateSetCalls.push(setArg);
          return {
            where: jest.fn((whereArg) => {
              updateWhereCalls.push(whereArg);
              return Promise.resolve([]);
            }),
          };
        }),
      }));

      dbMock.transaction.mockImplementation((cb) => cb(tx));

      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'down' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Presentation moved down' });
      // The adjacent-row lookup used gt/asc (searching for the nearest
      // sibling with a larger displayOrder), proving the "down" branch didn't
      // regress to the "up" branch's lt/desc comparison.
      expect(getAdjacentWhere()).toEqual(
        and(
          eq(presentations.childId, 5),
          eq(presentations.category, 'Practical Life'),
          gt(presentations.displayOrder, 2)
        )
      );
      expect(getAdjacentOrderBy()).toEqual(asc(presentations.displayOrder));
      expect(tx.update).toHaveBeenCalledTimes(2);
      // Moving down: the target presentation (id 1, currently at order 2)
      // takes the adjacent sibling's slot (order 3)...
      expect(updateSetCalls[0]).toEqual(expect.objectContaining({ displayOrder: 3, updatedBy: 1 }));
      expect(updateWhereCalls[0]).toEqual(eq(presentations.id, 1));
      // ...and the adjacent sibling (id 88) takes the target's old slot (order 2).
      expect(updateSetCalls[1]).toEqual(expect.objectContaining({ displayOrder: 2, updatedBy: 1 }));
      expect(updateWhereCalls[1]).toEqual(eq(presentations.id, 88));
      expect(realtimeMock.publishEvent).toHaveBeenCalledWith('class:9', 'presentation_changed', {
        classId: 9,
      });
    });

    test('500 when the transaction throws an unexpected error', async () => {
      dbMock.select.mockReturnValueOnce(
        makeChain([{ id: 1, category: 'Practical Life', displayOrder: 2, classId: 9 }])
      );
      dbMock.transaction.mockRejectedValueOnce(new Error('boom'));

      const res = await request(app)
        .put('/api/presentations/children/5/1/reorder')
        .set('Authorization', authHeader({ id: 1, role: 'admin' }))
        .send({ direction: 'up' });

      expect(res.status).toBe(500);
    });
  });
});
