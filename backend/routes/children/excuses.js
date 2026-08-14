import { Router } from 'express';
const router = Router();
import process from 'process';
import { and, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import {
  childExcuses,
  childParents,
  classChildren,
  classTeachers,
  users,
} from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const validateExcuse = (data) => {
  const errors = [];

  if (!data.date_from || !dateRegex.test(data.date_from)) {
    errors.push('date_from is required and must be YYYY-MM-DD');
  }

  if (!data.date_to || !dateRegex.test(data.date_to)) {
    errors.push('date_to is required and must be YYYY-MM-DD');
  }

  if (
    data.date_from &&
    data.date_to &&
    dateRegex.test(data.date_from) &&
    dateRegex.test(data.date_to)
  ) {
    const fromDate = new Date(data.date_from);
    const toDate = new Date(data.date_to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      errors.push('date_from and date_to must be valid dates');
    } else if (toDate < fromDate) {
      errors.push('date_to must be on or after date_from');
    }
  }

  if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length === 0) {
    errors.push('reason is required');
  }

  if (data.reason && data.reason.length > 1000) {
    errors.push('reason must not exceed 1000 characters');
  }

  return errors;
};

const canAccessChild = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'parent') {
    const result = await db
      .select({ id: childParents.childId })
      .from(childParents)
      .where(and(eq(childParents.childId, childId), eq(childParents.parentId, userId)))
      .limit(1);
    return result.length > 0;
  }

  if (userRole === 'teacher') {
    const result = await db
      .select({ id: classTeachers.classId })
      .from(classTeachers)
      .innerJoin(classChildren, eq(classTeachers.classId, classChildren.classId))
      .where(and(eq(classTeachers.teacherId, userId), eq(classChildren.childId, childId)))
      .limit(1);
    return result.length > 0;
  }

  return false;
};

router.get('/:id/excuses', auth, async (req, res) => {
  try {
    const childId = Number(req.params.id);

    if (!Number.isInteger(childId)) {
      return res.status(400).json({ error: 'Invalid child id' });
    }

    const canAccess = await canAccessChild(req.user.id, req.user.role, childId);
    if (!canAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await db
      .select({
        id: childExcuses.id,
        child_id: childExcuses.childId,
        parent_id: childExcuses.parentId,
        date_from: childExcuses.dateFrom,
        date_to: childExcuses.dateTo,
        reason: childExcuses.reason,
        created_at: childExcuses.createdAt,
        parent_firstname: users.firstname,
        parent_surname: users.surname,
      })
      .from(childExcuses)
      .leftJoin(users, eq(childExcuses.parentId, users.id))
      .where(eq(childExcuses.childId, childId))
      .orderBy(childExcuses.dateFrom, childExcuses.createdAt);

    res.json(result || []);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch excuses',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/:id/excuses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create excuses' });
    }

    const childId = Number(req.params.id);

    if (!Number.isInteger(childId)) {
      return res.status(400).json({ error: 'Invalid child id' });
    }

    const validationErrors = validateExcuse(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const relation = await db
      .select({ id: childParents.childId })
      .from(childParents)
      .where(and(eq(childParents.childId, childId), eq(childParents.parentId, req.user.id)))
      .limit(1);

    if (relation.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { date_from, date_to, reason } = req.body;

    const result = await db
      .insert(childExcuses)
      .values({
        childId,
        parentId: req.user.id,
        dateFrom: date_from,
        dateTo: date_to,
        reason: reason.trim(),
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create excuse',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.put('/:id/excuses/:excuseId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can update excuses' });
    }

    const childId = Number(req.params.id);
    const excuseId = Number(req.params.excuseId);

    if (!Number.isInteger(childId) || !Number.isInteger(excuseId)) {
      return res.status(400).json({ error: 'Invalid child or excuse id' });
    }

    const validationErrors = validateExcuse(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const relation = await db
      .select({ id: childParents.childId })
      .from(childParents)
      .where(and(eq(childParents.childId, childId), eq(childParents.parentId, req.user.id)))
      .limit(1);

    if (relation.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { date_from, date_to, reason } = req.body;

    const result = await db
      .update(childExcuses)
      .set({
        dateFrom: date_from,
        dateTo: date_to,
        reason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(childExcuses.id, excuseId),
          eq(childExcuses.childId, childId),
          eq(childExcuses.parentId, req.user.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Excuse not found or unauthorized' });
    }

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update excuse',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/:id/excuses/:excuseId', auth, async (req, res) => {
  try {
    const childId = Number(req.params.id);
    const excuseId = Number(req.params.excuseId);

    if (!Number.isInteger(childId) || !Number.isInteger(excuseId)) {
      return res.status(400).json({ error: 'Invalid child or excuse id' });
    }

    if (req.user.role !== 'parent' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const excuseResult = await db
      .select({
        id: childExcuses.id,
        child_id: childExcuses.childId,
        parent_id: childExcuses.parentId,
      })
      .from(childExcuses)
      .where(eq(childExcuses.id, excuseId))
      .limit(1);

    if (excuseResult.length === 0) {
      return res.status(404).json({ error: 'Excuse not found' });
    }

    const excuse = excuseResult[0];
    if (excuse.child_id !== childId) {
      return res.status(400).json({ error: 'Excuse does not belong to this child' });
    }

    if (req.user.role === 'parent') {
      const relation = await db
        .select({ id: childParents.childId })
        .from(childParents)
        .where(and(eq(childParents.childId, childId), eq(childParents.parentId, req.user.id)))
        .limit(1);

      if (relation.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (excuse.parent_id !== req.user.id) {
        return res.status(403).json({ error: "Cannot cancel another parent's excuse" });
      }
    }

    await db.delete(childExcuses).where(eq(childExcuses.id, excuseId));

    res.json({ message: 'Excuse cancelled' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel excuse',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
