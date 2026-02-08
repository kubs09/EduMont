/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

const isValidDateString = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTimestamp = (value) =>
  value === undefined || value === null || !Number.isNaN(Date.parse(value));

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const isTeacherForClass = async (userId, classId) => {
  const result = await pool.query(
    'SELECT 1 FROM class_teachers WHERE class_id = $1 AND teacher_id = $2',
    [classId, userId]
  );
  return result.rows.length > 0;
};

const isParentForChildInClass = async (userId, classId, childId) => {
  const result = await pool.query(
    `
    SELECT 1
    FROM class_children cc
    JOIN child_parents cp ON cp.child_id = cc.child_id
    WHERE cc.class_id = $1 AND cc.child_id = $2 AND cp.parent_id = $3
  `,
    [classId, childId, userId]
  );
  return result.rows.length > 0;
};

const isChildInClass = async (childId, classId) => {
  const result = await pool.query(
    'SELECT 1 FROM class_children WHERE class_id = $1 AND child_id = $2',
    [classId, childId]
  );
  return result.rows.length > 0;
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

    const params = [classId, attendanceDate];
    let query = `
      SELECT
        ch.id,
        ch.firstname,
        ch.surname,
        ca.attendance_date,
        ca.check_in_at,
        ca.check_out_at,
        ca.checked_in_by,
        ca.checked_out_by,
        ca.notes
      FROM class_children cc
      JOIN children ch ON cc.child_id = ch.id
      LEFT JOIN class_attendance ca
        ON ca.class_id = cc.class_id
        AND ca.child_id = cc.child_id
        AND ca.attendance_date = COALESCE($2, CURRENT_DATE)
      WHERE cc.class_id = $1
    `;

    if (childId) {
      query += ' AND ch.id = $3';
      params.push(childId);
    }

    query += ' ORDER BY ch.surname, ch.firstname';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
  }
});

router.post('/:id/attendance/check-in', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers and administrators can check in' });
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

    const childInClass = await isChildInClass(childId, classId);
    if (!childInClass) {
      return res.status(404).json({ error: 'Child is not assigned to this class' });
    }

    const dateValue = attendanceDate || new Date().toISOString().slice(0, 10);
    const existing = await pool.query(
      `
      SELECT id, check_in_at
      FROM class_attendance
      WHERE class_id = $1 AND child_id = $2 AND attendance_date = $3
    `,
      [classId, childId, dateValue]
    );

    if (existing.rows.length > 0 && existing.rows[0].check_in_at) {
      return res.status(409).json({ error: 'Child is already checked in for this date' });
    }

    if (existing.rows.length === 0) {
      const insertResult = await pool.query(
        `
        INSERT INTO class_attendance
          (class_id, child_id, attendance_date, check_in_at, checked_in_by, notes)
        VALUES ($1, $2, $3, COALESCE($4, NOW()), $5, $6)
        RETURNING *
      `,
        [classId, childId, dateValue, checkInAt, req.user.id, req.body.notes || null]
      );
      return res.status(201).json(insertResult.rows[0]);
    }

    const updateResult = await pool.query(
      `
      UPDATE class_attendance
      SET check_in_at = COALESCE($2, NOW()),
          checked_in_by = $3,
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
      [existing.rows[0].id, checkInAt, req.user.id, req.body.notes || null]
    );

    return res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check in child', details: error.message });
  }
});

router.post('/:id/attendance/check-out', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers and administrators can check out' });
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

    const childInClass = await isChildInClass(childId, classId);
    if (!childInClass) {
      return res.status(404).json({ error: 'Child is not assigned to this class' });
    }

    const dateValue = attendanceDate || new Date().toISOString().slice(0, 10);
    const existing = await pool.query(
      `
      SELECT id, check_in_at, check_out_at
      FROM class_attendance
      WHERE class_id = $1 AND child_id = $2 AND attendance_date = $3
    `,
      [classId, childId, dateValue]
    );

    if (existing.rows.length === 0 || !existing.rows[0].check_in_at) {
      return res.status(409).json({ error: 'Child must be checked in before check out' });
    }

    if (existing.rows[0].check_out_at) {
      return res.status(409).json({ error: 'Child is already checked out for this date' });
    }

    const updateResult = await pool.query(
      `
      UPDATE class_attendance
      SET check_out_at = COALESCE($2, NOW()),
          checked_out_by = $3,
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
      [existing.rows[0].id, checkOutAt, req.user.id, req.body.notes || null]
    );

    return res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check out child', details: error.message });
  }
});

module.exports = router;
