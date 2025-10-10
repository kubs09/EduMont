/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

const validateSchedule = (data) => {
  const errors = [];

  if (!data.child_id || !Number.isInteger(data.child_id)) {
    errors.push('Child ID is required and must be a valid number');
  }

  if (!data.class_id || !Number.isInteger(data.class_id)) {
    errors.push('Class ID is required and must be a valid number');
  }

  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Date is required and must be in YYYY-MM-DD format');
  }

  if (!data.start_time || !/^\d{2}:\d{2}$/.test(data.start_time)) {
    errors.push('Start time is required and must be in HH:MM format');
  }

  if (!data.duration_hours || !Number.isInteger(data.duration_hours)) {
    errors.push('Duration is required and must be a valid number');
  }

  if (data.duration_hours && (data.duration_hours < 1 || data.duration_hours > 3)) {
    errors.push('Duration must be between 1 and 3 hours');
  }

  if (data.activity && data.activity.length > 200) {
    errors.push('Activity must not exceed 200 characters');
  }

  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes must not exceed 1000 characters');
  }

  return errors;
};

const canAccessChildSchedule = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'parent') {
    const result = await pool.query('SELECT parent_id FROM children WHERE id = $1', [childId]);
    return result.rows.length > 0 && result.rows[0].parent_id === userId;
  }

  if (userRole === 'teacher') {
    const result = await pool.query(
      `
      SELECT 1 FROM class_teachers ct
      JOIN class_children cc ON ct.class_id = cc.class_id
      WHERE ct.teacher_id = $1 AND cc.child_id = $2
    `,
      [userId, childId]
    );
    return result.rows.length > 0;
  }

  return false;
};

const canEditChildSchedule = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'teacher') {
    const result = await pool.query(
      `
      SELECT 1 FROM class_teachers ct
      JOIN class_children cc ON ct.class_id = cc.class_id
      WHERE ct.teacher_id = $1 AND cc.child_id = $2
    `,
      [userId, childId]
    );
    return result.rows.length > 0;
  }

  return false;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date, week, month } = req.query;

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT 
        s.id,
        s.child_id,
        s.class_id,
        s.date,
        s.start_time,
        s.duration_hours,
        s.activity,
        s.notes,
        s.created_at,
        s.updated_at,
        c.name as class_name,
        ch.firstname as child_firstname,
        ch.surname as child_surname,
        creator.firstname as created_by_firstname,
        creator.surname as created_by_surname,
        updater.firstname as updated_by_firstname,
        updater.surname as updated_by_surname
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      JOIN children ch ON s.child_id = ch.id
      LEFT JOIN users creator ON s.created_by = creator.id
      LEFT JOIN users updater ON s.updated_by = updater.id
    `;

    const params = [];
    let whereConditions = [];

    if (req.user.role === 'teacher') {
      whereConditions.push(
        's.class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = $' +
          (params.length + 1) +
          ')'
      );
      params.push(req.user.id);
    }

    if (date) {
      whereConditions.push('s.date = $' + (params.length + 1));
      params.push(date);
    } else if (week) {
      whereConditions.push(
        's.date >= $' +
          (params.length + 1) +
          ' AND s.date < $' +
          (params.length + 1) +
          "::date + interval '7 days'"
      );
      params.push(week);
    } else if (month) {
      whereConditions.push("DATE_TRUNC('month', s.date) = $" + (params.length + 1) + '::date');
      params.push(month + '-01');
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY s.date ASC, s.start_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all schedules:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/child/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const { date, week, month } = req.query;

    const hasAccess = await canAccessChildSchedule(req.user.id, req.user.role, parseInt(childId));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT 
        s.id,
        s.child_id,
        s.class_id,
        s.date,
        s.start_time,
        s.duration_hours,
        s.activity,
        s.notes,
        s.created_at,
        s.updated_at,
        c.name as class_name,
        ch.firstname as child_firstname,
        ch.surname as child_surname,
        creator.firstname as created_by_firstname,
        creator.surname as created_by_surname,
        updater.firstname as updated_by_firstname,
        updater.surname as updated_by_surname
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      JOIN children ch ON s.child_id = ch.id
      LEFT JOIN users creator ON s.created_by = creator.id
      LEFT JOIN users updater ON s.updated_by = updater.id
      WHERE s.child_id = $1
    `;

    const params = [childId];

    if (date) {
      query += ' AND s.date = $2';
      params.push(date);
    } else if (week) {
      query += " AND s.date >= $2 AND s.date < $2::date + interval '7 days'";
      params.push(week);
    } else if (month) {
      query += " AND DATE_TRUNC('month', s.date) = $2::date";
      params.push(month + '-01');
    }

    query += ' ORDER BY s.date ASC, s.start_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, week, month } = req.query;

    if (req.user.role === 'teacher') {
      const teacherClassResult = await pool.query(
        'SELECT 1 FROM class_teachers WHERE class_id = $1 AND teacher_id = $2',
        [classId, req.user.id]
      );
      if (teacherClassResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'parent') {
      const parentChildResult = await pool.query(
        `
        SELECT 1 FROM class_children cc
        JOIN children ch ON cc.child_id = ch.id
        WHERE cc.class_id = $1 AND ch.parent_id = $2
      `,
        [classId, req.user.id]
      );
      if (parentChildResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = `
      SELECT 
        s.id,
        s.child_id,
        s.class_id,
        s.date,
        s.start_time,
        s.duration_hours,
        s.activity,
        s.notes,
        s.created_at,
        s.updated_at,
        c.name as class_name,
        ch.firstname as child_firstname,
        ch.surname as child_surname,
        creator.firstname as created_by_firstname,
        creator.surname as created_by_surname,
        updater.firstname as updated_by_firstname,
        updater.surname as updated_by_surname
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      JOIN children ch ON s.child_id = ch.id
      LEFT JOIN users creator ON s.created_by = creator.id
      LEFT JOIN users updater ON s.updated_by = updater.id
      WHERE s.class_id = $1
    `;

    const params = [classId];

    if (req.user.role === 'parent') {
      query += ' AND ch.parent_id = $2';
      params.push(req.user.id);
    }

    if (date) {
      query += ` AND s.date = $${params.length + 1}`;
      params.push(date);
    } else if (week) {
      query += ` AND s.date >= $${params.length + 1} AND s.date < $${
        params.length + 1
      }::date + interval '7 days'`;
      params.push(week);
    } else if (month) {
      query += ` AND DATE_TRUNC('month', s.date) = $${params.length + 1}::date`;
      params.push(month + '-01');
    }

    query += ' ORDER BY s.date ASC, s.start_time ASC, ch.surname ASC, ch.firstname ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching class schedule:', err);
    res.status(500).json({ error: 'Failed to fetch class schedule' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { child_id, class_id, date, start_time, duration_hours, activity, notes } = req.body;

    const validationErrors = validateSchedule(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const canEdit = await canEditChildSchedule(req.user.id, req.user.role, child_id);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's schedule" });
    }

    await client.query('BEGIN');

    const classChildResult = await client.query(
      'SELECT 1 FROM class_children WHERE child_id = $1 AND class_id = $2',
      [child_id, class_id]
    );

    if (classChildResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Child is not assigned to this class' });
    }

    const conflictResult = await client.query(
      `
      SELECT id FROM schedules 
      WHERE child_id = $1 AND date = $2 
      AND (
        (start_time <= $3 AND start_time + (duration_hours || ' hours')::interval > $3) OR
        (start_time < ($3 + ($4 || ' hours')::interval) AND start_time + (duration_hours || ' hours')::interval >= ($3 + ($4 || ' hours')::interval)) OR
        (start_time >= $3 AND start_time + (duration_hours || ' hours')::interval <= ($3 + ($4 || ' hours')::interval))
      )
    `,
      [child_id, date, start_time, duration_hours]
    );

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Time conflict with existing schedule entry' });
    }

    const result = await client.query(
      `
      INSERT INTO schedules (child_id, class_id, date, start_time, duration_hours, activity, notes, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING *
    `,
      [child_id, class_id, date, start_time, duration_hours, activity, notes, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating schedule:', err);
    res.status(500).json({ error: 'Failed to create schedule entry' });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { child_id, class_id, date, start_time, duration_hours, activity, notes } = req.body;

    const validationErrors = validateSchedule(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    await client.query('BEGIN');

    const scheduleResult = await client.query('SELECT child_id FROM schedules WHERE id = $1', [id]);
    if (scheduleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const canEdit = await canEditChildSchedule(req.user.id, req.user.role, child_id);
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's schedule" });
    }

    const classChildResult = await client.query(
      'SELECT 1 FROM class_children WHERE child_id = $1 AND class_id = $2',
      [child_id, class_id]
    );

    if (classChildResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Child is not assigned to this class' });
    }

    const conflictResult = await client.query(
      `
      SELECT id FROM schedules 
      WHERE child_id = $1 AND date = $2 AND id != $5
      AND (
        (start_time <= $3 AND start_time + (duration_hours || ' hours')::interval > $3) OR
        (start_time < ($3 + ($4 || ' hours')::interval) AND start_time + (duration_hours || ' hours')::interval >= ($3 + ($4 || ' hours')::interval)) OR
        (start_time >= $3 AND start_time + (duration_hours || ' hours')::interval <= ($3 + ($4 || ' hours')::interval))
      )
    `,
      [child_id, date, start_time, duration_hours, id]
    );

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Time conflict with existing schedule entry' });
    }

    const result = await client.query(
      `
      UPDATE schedules 
      SET child_id = $1, class_id = $2, date = $3, start_time = $4, duration_hours = $5, 
          activity = $6, notes = $7, updated_at = CURRENT_TIMESTAMP, updated_by = $8
      WHERE id = $9
      RETURNING *
    `,
      [child_id, class_id, date, start_time, duration_hours, activity, notes, req.user.id, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating schedule:', err);
    res.status(500).json({ error: 'Failed to update schedule entry' });
  } finally {
    client.release();
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const scheduleResult = await client.query('SELECT child_id FROM schedules WHERE id = $1', [id]);
    if (scheduleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const childId = scheduleResult.rows[0].child_id;

    // Check if user can edit this child's schedule
    const canEdit = await canEditChildSchedule(req.user.id, req.user.role, childId);
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'You do not have permission to delete this schedule entry' });
    }

    // Delete the schedule
    await client.query('DELETE FROM schedules WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Schedule entry deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting schedule:', err);
    res.status(500).json({ error: 'Failed to delete schedule entry' });
  } finally {
    client.release();
  }
});

module.exports = router;
