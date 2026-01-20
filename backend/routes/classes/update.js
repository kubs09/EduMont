/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Update a class
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

module.exports = router;
