/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { canAccessChildSchedule } = require('./validation');

// Get all schedules (admin/teacher)
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

// Get schedules for a specific child
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

// Get schedules for a specific class
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

module.exports = router;
