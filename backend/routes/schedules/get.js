/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { canAccessChildSchedule } = require('./validation');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT 
        s.id,
        s.child_id,
        s.class_id,
        s.name,
        s.category,
        s.display_order,
        s.status,
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

    if (status) {
      whereConditions.push('s.status = $' + (params.length + 1));
      params.push(status);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY s.category ASC, s.display_order ASC';

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
    const { status } = req.query;

    const hasAccess = await canAccessChildSchedule(req.user.id, req.user.role, parseInt(childId));
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT 
        s.id,
        s.child_id,
        s.class_id,
        s.name,
        s.category,
        s.display_order,
        s.status,
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

    if (status) {
      query += ' AND s.status = $2';
      params.push(status);
    }

    query += ' ORDER BY s.category ASC, s.display_order ASC';

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
    const { status } = req.query;

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
        WHERE cc.class_id = $1 AND EXISTS (
          SELECT 1 FROM child_parents cp WHERE cp.child_id = ch.id AND cp.parent_id = $2
        )
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
        s.name,
        s.category,
        s.display_order,
        s.status,
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
      query +=
        ' AND EXISTS (SELECT 1 FROM child_parents cp WHERE cp.child_id = ch.id AND cp.parent_id = $2)';
      params.push(req.user.id);
    }

    if (status) {
      query += ` AND s.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY s.category ASC, s.display_order ASC, ch.surname ASC, ch.firstname ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching class schedule:', err);
    res.status(500).json({ error: 'Failed to fetch class schedule' });
  }
});

module.exports = router;

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
        WHERE cc.class_id = $1 AND EXISTS (
          SELECT 1 FROM child_parents cp WHERE cp.child_id = ch.id AND cp.parent_id = $2
        )
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
      query +=
        ' AND EXISTS (SELECT 1 FROM child_parents cp WHERE cp.child_id = ch.id AND cp.parent_id = $2)';
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
