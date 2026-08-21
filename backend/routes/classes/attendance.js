import { Router } from 'express';
const router = Router();
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import {
  classAttendance,
  classChildren,
  classTeachers,
  childParents,
  children,
} from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

const isValidDateString = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTimestamp = (value) =>
  value === undefined || value === null || !Number.isNaN(Date.parse(value));

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const isTeacherForClass = async (userId, classId) => {
  const rows = await db
    .select({ classId: classTeachers.classId })
    .from(classTeachers)
    .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, userId)));
  return rows.length > 0;
};

const isParentForChildInClass = async (userId, classId, childId) => {
  const rows = await db
    .select({ classId: classChildren.classId })
    .from(classChildren)
    .innerJoin(childParents, eq(childParents.childId, classChildren.childId))
    .where(
      and(
        eq(classChildren.classId, classId),
        eq(classChildren.childId, childId),
        eq(childParents.parentId, userId)
      )
    );
  return rows.length > 0;
};

const isChildInClass = async (childId, classId) => {
  const rows = await db
    .select({ classId: classChildren.classId })
    .from(classChildren)
    .where(and(eq(classChildren.classId, classId), eq(classChildren.childId, childId)));
  return rows.length > 0;
};

router.get('/:id/attendance', auth, async (req, res) => {
  const classId = parseId(req.params.id);
  const childId = req.query.child_id !== undefined ? parseId(req.query.child_id) : null;
  const attendanceDate = isValidDateString(req.query.date) ? req.query.date : null;

  if (!classId) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }

  if (req.query.child_id !== undefined && !childId) {
    return res.status(400).json({ error: 'Invalid child ID' });
  }

  if (req.query.date !== undefined && !attendanceDate) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  try {
    if (req.user.role === 'teacher') {
      const hasAccess = await isTeacherForClass(req.user.id, classId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'parent') {
      if (!childId) {
        return res.status(400).json({ error: 'child_id is required for parent access' });
      }

      const hasAccess = await isParentForChildInClass(req.user.id, classId, childId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = db
      .select({
        id: children.id,
        firstname: children.firstname,
        surname: children.surname,
        attendance_date: classAttendance.attendanceDate,
        check_in_at: classAttendance.checkInAt,
        check_out_at: classAttendance.checkOutAt,
        checked_in_by: classAttendance.checkedInBy,
        checked_out_by: classAttendance.checkedOutBy,
        notes: classAttendance.notes,
      })
      .from(classChildren)
      .innerJoin(children, eq(classChildren.childId, children.id))
      .leftJoin(
        classAttendance,
        and(
          eq(classAttendance.classId, classChildren.classId),
          eq(classAttendance.childId, classChildren.childId),
          eq(classAttendance.attendanceDate, sql`COALESCE(${attendanceDate}, CURRENT_DATE)`)
        )
      )
      .where(eq(classChildren.classId, classId));

    if (childId) {
      query = query.where(and(eq(classChildren.classId, classId), eq(children.id, childId)));
    }

    const result = await query.orderBy(asc(children.surname), asc(children.firstname));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
  }
});

router.post('/:id/attendance/check-in', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'parent') {
    return res
      .status(403)
      .json({ error: 'Only teachers, administrators, or parents can check in' });
  }

  const classId = parseId(req.params.id);
  const childId = parseId(req.body.child_id);
  const attendanceDate = isValidDateString(req.body.attendance_date)
    ? req.body.attendance_date
    : null;
  const checkInAt = req.body.check_in_at;

  if (!classId) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }

  if (!childId) {
    return res.status(400).json({ error: 'Invalid child ID' });
  }

  if (req.body.attendance_date !== undefined && !attendanceDate) {
    return res.status(400).json({ error: 'Invalid attendance_date format. Use YYYY-MM-DD.' });
  }

  if (!isValidTimestamp(checkInAt)) {
    return res.status(400).json({ error: 'Invalid check_in_at timestamp' });
  }

  try {
    if (req.user.role === 'teacher') {
      const hasAccess = await isTeacherForClass(req.user.id, classId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (req.user.role === 'parent') {
      const hasAccess = await isParentForChildInClass(req.user.id, classId, childId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const childInClass = await isChildInClass(childId, classId);
    if (!childInClass) {
      return res.status(404).json({ error: 'Child is not assigned to this class' });
    }

    const dateValue = attendanceDate || new Date().toISOString().slice(0, 10);
    const existing = await db
      .select({ id: classAttendance.id, checkInAt: classAttendance.checkInAt })
      .from(classAttendance)
      .where(
        and(
          eq(classAttendance.classId, classId),
          eq(classAttendance.childId, childId),
          eq(classAttendance.attendanceDate, dateValue)
        )
      );

    if (existing.length > 0 && existing[0].checkInAt) {
      return res.status(409).json({ error: 'Child is already checked in for this date' });
    }

    if (existing.length === 0) {
      const inserted = await db
        .insert(classAttendance)
        .values({
          classId,
          childId,
          attendanceDate: dateValue,
          checkInAt: checkInAt ? new Date(checkInAt) : new Date(),
          checkedInBy: req.user.id,
          notes: req.body.notes || null,
        })
        .returning();
      return res.status(201).json(inserted[0]);
    }

    const updated = await db
      .update(classAttendance)
      .set({
        checkInAt: checkInAt ? new Date(checkInAt) : new Date(),
        checkedInBy: req.user.id,
        notes: req.body.notes || undefined,
        updatedAt: new Date(),
      })
      .where(eq(classAttendance.id, existing[0].id))
      .returning();

    return res.status(200).json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in child', details: error.message });
  }
});

router.post('/:id/attendance/check-out', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'parent') {
    return res
      .status(403)
      .json({ error: 'Only teachers, administrators, or parents can check out' });
  }

  const classId = parseId(req.params.id);
  const childId = parseId(req.body.child_id);
  const attendanceDate = isValidDateString(req.body.attendance_date)
    ? req.body.attendance_date
    : null;
  const checkOutAt = req.body.check_out_at;

  if (!classId) {
    return res.status(400).json({ error: 'Invalid class ID' });
  }

  if (!childId) {
    return res.status(400).json({ error: 'Invalid child ID' });
  }

  if (req.body.attendance_date !== undefined && !attendanceDate) {
    return res.status(400).json({ error: 'Invalid attendance_date format. Use YYYY-MM-DD.' });
  }

  if (!isValidTimestamp(checkOutAt)) {
    return res.status(400).json({ error: 'Invalid check_out_at timestamp' });
  }

  try {
    if (req.user.role === 'teacher') {
      const hasAccess = await isTeacherForClass(req.user.id, classId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (req.user.role === 'parent') {
      const hasAccess = await isParentForChildInClass(req.user.id, classId, childId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const childInClass = await isChildInClass(childId, classId);
    if (!childInClass) {
      return res.status(404).json({ error: 'Child is not assigned to this class' });
    }

    const dateValue = attendanceDate || new Date().toISOString().slice(0, 10);
    const existing = await db
      .select({
        id: classAttendance.id,
        checkInAt: classAttendance.checkInAt,
        checkOutAt: classAttendance.checkOutAt,
      })
      .from(classAttendance)
      .where(
        and(
          eq(classAttendance.classId, classId),
          eq(classAttendance.childId, childId),
          eq(classAttendance.attendanceDate, dateValue)
        )
      );

    if (existing.length === 0 || !existing[0].checkInAt) {
      return res.status(409).json({ error: 'Child must be checked in before check out' });
    }

    if (existing[0].checkOutAt) {
      return res.status(409).json({ error: 'Child is already checked out for this date' });
    }

    const updated = await db
      .update(classAttendance)
      .set({
        checkOutAt: checkOutAt ? new Date(checkOutAt) : new Date(),
        checkedOutBy: req.user.id,
        notes: req.body.notes || undefined,
        updatedAt: new Date(),
      })
      .where(eq(classAttendance.id, existing[0].id))
      .returning();

    return res.status(200).json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out child', details: error.message });
  }
});

export default router;
