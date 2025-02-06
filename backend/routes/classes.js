/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    let query = '';
    const params = [];

    if (req.user.role === 'admin') {
      query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          json_agg(DISTINCT jsonb_build_object(
            'id', u.id,
            'firstname', u.firstname,
            'surname', u.surname
          )) FILTER (WHERE u.id IS NOT NULL) as teachers,
          json_agg(DISTINCT jsonb_build_object(
            'id', ch.id,
            'firstname', ch.firstname,
            'surname', ch.surname
          )) FILTER (WHERE ch.id IS NOT NULL) as children
        FROM classes c
        LEFT JOIN class_teachers ct ON c.id = ct.class_id
        LEFT JOIN users u ON ct.teacher_id = u.id
        LEFT JOIN class_children cc ON c.id = cc.class_id
        LEFT JOIN children ch ON cc.child_id = ch.id
        GROUP BY c.id
        ORDER BY c.name
      `;
    } else if (req.user.role === 'teacher') {
      query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          json_agg(DISTINCT jsonb_build_object(
            'id', u.id,
            'firstname', u.firstname,
            'surname', u.surname
          )) FILTER (WHERE u.id IS NOT NULL) as teachers,
          json_agg(DISTINCT jsonb_build_object(
            'id', ch.id,
            'firstname', ch.firstname,
            'surname', ch.surname
          )) FILTER (WHERE ch.id IS NOT NULL) as children
        FROM classes c
        LEFT JOIN class_teachers ct ON c.id = ct.class_id
        LEFT JOIN users u ON ct.teacher_id = u.id
        LEFT JOIN class_children cc ON c.id = cc.class_id
        LEFT JOIN children ch ON cc.child_id = ch.id
        WHERE ct.teacher_id = $1
        GROUP BY c.id
        ORDER BY c.name
      `;
      params.push(req.user.id);
    } else if (req.user.role === 'parent') {
      query = `
        SELECT 
          c.id,
          c.name,
          c.description,
          json_agg(DISTINCT jsonb_build_object(
            'id', u.id,
            'firstname', u.firstname,
            'surname', u.surname
          )) FILTER (WHERE u.id IS NOT NULL) as teachers,
          json_agg(DISTINCT jsonb_build_object(
            'id', ch.id,
            'firstname', ch.firstname,
            'surname', ch.surname
          )) FILTER (WHERE ch.id IS NOT NULL) as children
        FROM classes c
        LEFT JOIN class_teachers ct ON c.id = ct.class_id
        LEFT JOIN users u ON ct.teacher_id = u.id
        LEFT JOIN class_children cc ON c.id = cc.class_id
        LEFT JOIN children ch ON cc.child_id = ch.id
        WHERE ch.parent_id = $1
        GROUP BY c.id
        ORDER BY c.name
      `;
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    let query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'firstname', t.firstname,
          'surname', t.surname
        )) as teachers,
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ch.id,
          'firstname', ch.firstname,
          'surname', ch.surname,
          'date_of_birth', ch.date_of_birth,
          'contact', ch.contact,
          'parent_id', ch.parent_id,
          'parent_firstname', p.firstname,
          'parent_surname', p.surname,
          'parent_email', p.email
        )) FILTER (WHERE ch.id IS NOT NULL`;

    // Add parent filtering condition
    if (req.user.role === 'parent') {
      query += ` AND ch.parent_id = ${req.user.id}`;
    }

    query += `) as children
      FROM classes c
      LEFT JOIN class_teachers ct ON c.id = ct.class_id
      LEFT JOIN users t ON ct.teacher_id = t.id
      LEFT JOIN class_children cc ON c.id = cc.class_id
      LEFT JOIN children ch ON cc.child_id = ch.id
      LEFT JOIN users p ON ch.parent_id = p.id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description`;

    const classDetails = await pool.query(query, [req.params.id]);

    if (classDetails.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const result = classDetails.rows[0];

    // Calculate age for each child
    if (result.children[0] !== null) {
      result.children = result.children.map((child) => ({
        ...child,
        age: calculateAge(child.date_of_birth),
        parent: `${child.parent_firstname} ${child.parent_surname}`,
      }));
    }

    res.json(result);
  } catch (error) {
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

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can create classes' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, teacherIds, childrenIds } = req.body;

    const classResult = await client.query(
      'INSERT INTO classes (name, description) VALUES ($1, $2) RETURNING id',
      [name, description]
    );
    const classId = classResult.rows[0].id;

    if (teacherIds?.length) {
      const teacherValues = teacherIds.map((id) => `(${classId}, ${id})`).join(',');
      await client.query(`
        INSERT INTO class_teachers (class_id, teacher_id) VALUES ${teacherValues}
      `);
    }

    if (childrenIds?.length) {
      const childrenValues = childrenIds.map((id) => `(${classId}, ${id})`).join(',');
      await client.query(`
        INSERT INTO class_children (class_id, child_id) VALUES ${childrenValues}
      `);
    }

    await client.query('COMMIT');
    res.status(201).json({ id: classId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create class' });
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
    const { name, description, teacherIds, childrenIds } = req.body;

    if (name || description) {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }

      if (updates.length > 0) {
        values.push(id);
        await client.query(
          `UPDATE classes 
           SET ${updates.join(', ')} 
           WHERE id = $${paramCount}`,
          values
        );
      }
    }

    // Update teachers if provided
    if (Array.isArray(teacherIds)) {
      await client.query('DELETE FROM class_teachers WHERE class_id = $1', [id]);
      if (teacherIds.length > 0) {
        const teacherValues = teacherIds.map((teacherId) => `(${id}, ${teacherId})`).join(',');
        await client.query(`
          INSERT INTO class_teachers (class_id, teacher_id) VALUES ${teacherValues}
        `);
      }
    }

    // Update children if provided
    if (Array.isArray(childrenIds)) {
      await client.query('DELETE FROM class_children WHERE class_id = $1', [id]);
      if (childrenIds.length > 0) {
        const childrenValues = childrenIds.map((childId) => `(${id}, ${childId})`).join(',');
        await client.query(`
          INSERT INTO class_children (class_id, child_id) VALUES ${childrenValues}
        `);
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
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
  try {
    const result = await pool.query(
      `SELECT 
        ch.id,
        ch.date,
        ch.notes,
        ch.created_at,
        json_build_object(
          'id', u.id,
          'firstname', u.firstname,
          'surname', u.surname
        ) as created_by
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

module.exports = router;
