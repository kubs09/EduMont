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
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Create a new class
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
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  } finally {
    client.release();
  }
});

// Update a class
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update classes' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, description, teacherIds, childrenIds } = req.body;

    // Only update class details if name or description is provided
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
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  } finally {
    client.release();
  }
});

module.exports = router;
