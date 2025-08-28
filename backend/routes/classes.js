/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    let query = '';
    const params = [];

    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.min_age,
          c.max_age,
          COALESCE(
            (SELECT json_agg(teacher)
            FROM (
              SELECT u.id, u.firstname, u.surname
              FROM class_teachers ct
              JOIN users u ON ct.teacher_id = u.id
              WHERE ct.class_id = c.id
            ) teacher),
            '[]'
          ) as teachers,
          COALESCE(
            (SELECT json_agg(child)
            FROM (
              SELECT 
                ch.id,
                ch.firstname,
                ch.surname,
                ch.date_of_birth,
                p.firstname as parent_firstname,
                p.surname as parent_surname,
                p.email as parent_email,
                concat(p.firstname, ' ', p.surname) as parent,
                p.phone as parent_contact,
                ch.parent_id,
                cc.confirmed,
                cc.status,
                EXTRACT(YEAR FROM age(CURRENT_DATE, ch.date_of_birth))::integer as age
              FROM class_children cc
              JOIN children ch ON cc.child_id = ch.id
              JOIN users p ON ch.parent_id = p.id
              WHERE cc.class_id = c.id
            ) child),
            '[]'
          ) as children
        FROM classes c`;
      if (req.user.role === 'teacher') {
        query += ` WHERE EXISTS (
          SELECT 1 FROM class_teachers ct 
          WHERE ct.class_id = c.id AND ct.teacher_id = $1
        )`;
        params.push(req.user.id);
      }
      query += ' ORDER BY c.name';
    } else if (req.user.role === 'parent') {
      query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.min_age,
          c.max_age,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', u.id,
                'firstname', u.firstname,
                'surname', u.surname
              )
            )
            FROM class_teachers ct
            JOIN users u ON ct.teacher_id = u.id
            WHERE ct.class_id = c.id),
            '[]'
          ) as teachers,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', ch.id,
                'firstname', ch.firstname,
                'surname', ch.surname,
                'status', cc.status,
                'confirmed', cc.confirmed
              )
            )
            FROM class_children cc
            JOIN children ch ON cc.child_id = ch.id
            WHERE cc.class_id = c.id AND ch.parent_id = $1),
            '[]'
          ) as children
        FROM classes c
        WHERE EXISTS (
          SELECT 1 FROM class_children cc
          JOIN children ch ON cc.child_id = ch.id
          WHERE cc.class_id = c.id AND ch.parent_id = $1
        )
        ORDER BY c.name`;
      params.push(req.user.id);
    }
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch classes',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    let query = `
      SELECT 
        c.*,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'firstname', t.firstname,
            'surname', t.surname
          )) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        ) as teachers,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', ch.id,
            'firstname', ch.firstname,
            'surname', ch.surname,
            'date_of_birth', ch.date_of_birth,
            'parent_id', ch.parent_id,
            'parent_firstname', p.firstname,
            'parent_surname', p.surname,
            'parent_email', p.email,
            'parent_contact', p.phone,
            'confirmed', cc.confirmed,
            'status', COALESCE(cc.status, 'pending'),
            'age', EXTRACT(YEAR FROM age(CURRENT_DATE, ch.date_of_birth))::integer
          )) FILTER (WHERE ch.id IS NOT NULL),
          '[]'::jsonb
        ) as children
      FROM classes c
      LEFT JOIN class_teachers ct ON c.id = ct.class_id
      LEFT JOIN users t ON ct.teacher_id = t.id
      LEFT JOIN class_children cc ON c.id = cc.class_id
      LEFT JOIN children ch ON cc.child_id = ch.id
      LEFT JOIN users p ON ch.parent_id = p.id
      WHERE c.id = $1`;

    const params = [req.params.id];

    if (req.user.role === 'parent') {
      query += ` AND ch.parent_id = $2`;
      params.push(req.user.id);
    }

    query += ` GROUP BY c.id, c.name, c.description, c.min_age, c.max_age`;

    const classDetails = await pool.query(query, params);
    if (classDetails.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(classDetails.rows[0]);
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ error: 'Failed to fetch class details' });
  }
});

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// New endpoint to trigger automatic class assignment
router.post('/auto-assign', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can trigger auto-assignment' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // First, clear all unconfirmed assignments
    await client.query('DELETE FROM class_children WHERE confirmed = FALSE');

    // Get all children who aren't assigned to any class or have unconfirmed assignments
    const childrenQuery = `
      SELECT id, date_of_birth 
      FROM children ch
      WHERE NOT EXISTS (
        SELECT 1 FROM class_children cc 
        WHERE cc.child_id = ch.id AND cc.confirmed = TRUE
      )
    `;
    const childrenResult = await client.query(childrenQuery);

    // Get all classes with their age ranges
    const classesQuery = 'SELECT id, min_age, max_age FROM classes ORDER BY min_age';
    const classesResult = await client.query(classesQuery);

    // For each child, find the most appropriate class based on age
    for (const child of childrenResult.rows) {
      const age = calculateAge(child.date_of_birth);
      // Find the most appropriate class for this age
      const suitableClass = classesResult.rows.find((c) => age >= c.min_age && age <= c.max_age);

      if (suitableClass) {
        await client.query(
          `INSERT INTO class_children (class_id, child_id, confirmed, created_at) 
           VALUES ($1, $2, FALSE, CURRENT_TIMESTAMP)
           ON CONFLICT (class_id, child_id) 
           DO UPDATE SET confirmed = FALSE, created_at = CURRENT_TIMESTAMP`,
          [suitableClass.id, child.id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Automatic class assignment completed' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({
      error: 'Failed to perform automatic class assignment',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Modify the create class endpoint to include age range
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can create classes' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, min_age, max_age, teacherIds } = req.body;
    const classResult = await client.query(
      'INSERT INTO classes (name, description, min_age, max_age) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, description, min_age, max_age]
    );
    const classId = classResult.rows[0].id;

    if (Array.isArray(teacherIds) && teacherIds.length > 0) {
      const values = teacherIds.map((_, idx) => `($1, $${idx + 2})`).join(',');
      const params = [classId, ...teacherIds];
      const query = `INSERT INTO class_teachers (class_id, teacher_id) VALUES ${values}`;
      await client.query(query, params);
    }

    await client.query('COMMIT');
    res.status(201).json({ id: classId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({
      error: 'Failed to create class',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Update the confirmation endpoint to only update one child
router.post('/:classId/children/:childId/confirm', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only administrators and teachers can confirm class assignments' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE class_children SET confirmed = TRUE, status = $3 WHERE class_id = $1 AND child_id = $2',
      [req.params.classId, req.params.childId, 'accepted']
    );

    // Fetch updated class data
    const result = await client.query(
      `
      SELECT 
        c.*,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'firstname', t.firstname,
            'surname', t.surname
          )) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        ) as teachers,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', ch.id,
            'firstname', ch.firstname,
            'surname', ch.surname,
            'date_of_birth', ch.date_of_birth,
            'parent_id', ch.parent_id,
            'parent_firstname', p.firstname,
            'parent_surname', p.surname,
            'parent_email', p.email,
            'parent_contact', p.phone,
            'confirmed', cc.confirmed,
            'status', COALESCE(cc.status, 'pending'),
            'age', EXTRACT(YEAR FROM age(CURRENT_DATE, ch.date_of_birth))::integer
          )) FILTER (WHERE ch.id IS NOT NULL),
          '[]'::jsonb
        ) as children
      FROM classes c
      LEFT JOIN class_teachers ct ON c.id = ct.class_id
      LEFT JOIN users t ON ct.teacher_id = t.id
      LEFT JOIN class_children cc ON c.id = cc.class_id
      LEFT JOIN children ch ON cc.child_id = ch.id
      LEFT JOIN users p ON ch.parent_id = p.id
      WHERE c.id = $1
      GROUP BY c.id`,
      [req.params.classId]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to confirm class assignment' });
  } finally {
    client.release();
  }
});

// Endpoint to deny a child
router.post('/:classId/children/:childId/deny', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only administrators and teachers can deny class assignments' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE class_children SET confirmed = FALSE, status = $3 WHERE class_id = $1 AND child_id = $2',
      [req.params.classId, req.params.childId, 'denied']
    );

    // Fetch updated class data with all children and their confirmation status
    const result = await client.query(
      `
      SELECT 
        c.*,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'firstname', t.firstname,
            'surname', t.surname
          )) FILTER (WHERE t.id IS NOT NULL),
          '[]'::jsonb
        ) as teachers,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', ch.id,
            'firstname', ch.firstname,
            'surname', ch.surname,
            'date_of_birth', ch.date_of_birth,
            'parent_id', ch.parent_id,
            'parent_firstname', p.firstname,
            'parent_surname', p.surname,
            'parent_email', p.email,
            'parent_contact', p.phone,
            'confirmed', COALESCE(cc.confirmed, false),
            'status', CASE 
              WHEN cc.status = 'denied' THEN 'denied'
              WHEN cc.confirmed THEN 'accepted'
              ELSE 'pending'
            END,
            'age', EXTRACT(YEAR FROM age(CURRENT_DATE, ch.date_of_birth))::integer
          )) FILTER (WHERE ch.id IS NOT NULL),
          '[]'::jsonb
        ) as children
      FROM classes c
      LEFT JOIN class_teachers ct ON c.id = ct.class_id
      LEFT JOIN users t ON ct.teacher_id = t.id
      LEFT JOIN class_children cc ON c.id = cc.class_id
      LEFT JOIN children ch ON cc.child_id = ch.id
      LEFT JOIN users p ON ch.parent_id = p.id
      WHERE c.id = $1
      GROUP BY c.id`,
      [req.params.classId]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to deny class assignment' });
  } finally {
    client.release();
  }
});

router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update classes' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, description, min_age, max_age, teacherIds } = req.body;

    // Validate required fields
    if (
      !name ||
      min_age === undefined ||
      min_age === null ||
      max_age === undefined ||
      max_age === null
    ) {
      throw new Error('Missing required fields: name, min_age, and max_age are required');
    }

    // Convert to numbers and validate
    const minAge = Number(min_age);
    const maxAge = Number(max_age);

    if (isNaN(minAge) || isNaN(maxAge) || minAge < 0 || maxAge < minAge) {
      throw new Error('Invalid age range values');
    }

    // First update the class details
    await client.query(
      'UPDATE classes SET name = $1, description = $2, min_age = $3, max_age = $4 WHERE id = $5',
      [name, description, minAge, maxAge, id]
    );

    // Then handle teacher assignments
    await client.query('DELETE FROM class_teachers WHERE class_id = $1', [id]);

    if (Array.isArray(teacherIds) && teacherIds.length > 0) {
      const values = teacherIds.map((_, idx) => `($1, $${idx + 2})`).join(',');
      const params = [id, ...teacherIds.filter((tid) => tid !== null && tid !== undefined)];
      const query = `INSERT INTO class_teachers (class_id, teacher_id) VALUES ${values}`;
      await client.query(query, params);
    }

    await client.query('COMMIT');
    // Return the updated class data
    const updatedClass = await client.query(
      `
      SELECT c.*, 
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'firstname', t.firstname, 'surname', t.surname)
          ) FILTER (WHERE t.id IS NOT NULL), 
          '[]'
        ) as teachers
      FROM classes c
      LEFT JOIN class_teachers ct ON c.id = ct.class_id
      LEFT JOIN users t ON ct.teacher_id = t.id
      WHERE c.id = $1
      GROUP BY c.id`,
      [id]
    );

    res.json(updatedClass.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({
      error: 'Failed to update class',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Delete a class
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete classes' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Delete related records first
    await client.query('DELETE FROM class_teachers WHERE class_id = $1', [id]);
    await client.query('DELETE FROM class_children WHERE class_id = $1', [id]);
    await client.query('DELETE FROM classes WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete class' });
  } finally {
    client.release();
  }
});

// Get class history
router.get('/:id/history', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only teachers and administrators can view class history' });
  }

  try {
    const result = await pool.query(
      `
      SELECT ch.*, 
        json_build_object('id', u.id, 'firstname', u.firstname, 'surname', u.surname) as created_by
      FROM class_history ch
      LEFT JOIN users u ON ch.created_by = u.id
      WHERE ch.class_id = $1
      ORDER BY ch.date DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch class history' });
  }
});

// Add class history entry
router.post('/:id/history', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only teachers and administrators can add history entries' });
  }

  try {
    const { date, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO class_history (class_id, date, notes, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, date, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create history entry' });
  }
});

// Delete class history entry
router.delete('/:classId/history/:historyId', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only teachers and administrators can delete history entries' });
  }

  try {
    await pool.query('DELETE FROM class_history WHERE id = $1 AND class_id = $2', [
      req.params.historyId,
      req.params.classId,
    ]);
    res.json({ message: 'History entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
});

// GET /api/classes/:id/next-activities - Get next scheduled activities for children in a class
router.get('/:id/next-activities', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has access to this class
    if (req.user.role === 'teacher') {
      const teacherClassResult = await pool.query(
        'SELECT 1 FROM class_teachers WHERE class_id = $1 AND teacher_id = $2',
        [id, req.user.id]
      );
      if (teacherClassResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'parent') {
      const parentChildResult = await pool.query(
        'SELECT 1 FROM class_children cc JOIN children ch ON cc.child_id = ch.id WHERE cc.class_id = $1 AND ch.parent_id = $2',
        [id, req.user.id]
      );
      if (parentChildResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = `
      WITH next_schedules AS (
        SELECT DISTINCT ON (s.child_id)
          s.child_id,
          s.date,
          s.start_time,
          (s.start_time + INTERVAL '1 hour' * s.duration_hours) AS end_time,
          s.activity,
          s.notes,
          ch.firstname,
          ch.surname,
          ROW_NUMBER() OVER (PARTITION BY s.child_id ORDER BY s.date ASC, s.start_time ASC) as rn
        FROM schedules s
        JOIN children ch ON s.child_id = ch.id
        JOIN class_children cc ON ch.id = cc.child_id
        WHERE cc.class_id = $1 
          AND (s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.start_time > CURRENT_TIME))
          AND cc.confirmed = true
    `;

    const params = [id];

    // For parents, only show their children's next activities
    if (req.user.role === 'parent') {
      query += ` AND ch.parent_id = $2`;
      params.push(req.user.id);
    }

    query += `
        ORDER BY s.child_id, s.date ASC, s.start_time ASC
      )
      SELECT * FROM next_schedules WHERE rn = 1
      ORDER BY date ASC, start_time ASC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching next activities:', err);
    res.status(500).json({ error: 'Failed to fetch next activities' });
  }
});

module.exports = router;
