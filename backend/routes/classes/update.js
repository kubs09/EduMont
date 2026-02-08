/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update classes' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, description, min_age, max_age, teacherId, assistantId } = req.body;

    if (
      !name ||
      min_age === undefined ||
      min_age === null ||
      max_age === undefined ||
      max_age === null
    ) {
      throw new Error('Missing required fields: name, min_age, and max_age are required');
    }

    const minAge = Number(min_age);
    const maxAge = Number(max_age);

    if (isNaN(minAge) || isNaN(maxAge) || minAge < 0 || maxAge < minAge) {
      throw new Error('Invalid age range values');
    }

    await client.query(
      'UPDATE classes SET name = $1, description = $2, min_age = $3, max_age = $4 WHERE id = $5',
      [name, description, minAge, maxAge, id]
    );

    if (!teacherId) {
      throw new Error('Missing required field: teacherId is required');
    }

    if (assistantId && assistantId === teacherId) {
      throw new Error('Assistant cannot be the same as the main teacher');
    }

    const assignedTeacher = await client.query(
      'SELECT class_id FROM class_teachers WHERE teacher_id = $1 AND class_id <> $2 LIMIT 1',
      [teacherId, id]
    );

    if (assignedTeacher.rows.length > 0) {
      throw new Error('Selected teacher is already assigned to another class');
    }

    if (assistantId) {
      const assignedAssistant = await client.query(
        'SELECT class_id FROM class_teachers WHERE teacher_id = $1 AND class_id <> $2 LIMIT 1',
        [assistantId, id]
      );

      if (assignedAssistant.rows.length > 0) {
        throw new Error('Selected assistant is already assigned to another class');
      }
    }

    await client.query('DELETE FROM class_teachers WHERE class_id = $1', [id]);

    await client.query(
      'INSERT INTO class_teachers (class_id, teacher_id, role) VALUES ($1, $2, $3)',
      [id, teacherId, 'teacher']
    );

    if (assistantId) {
      await client.query(
        'INSERT INTO class_teachers (class_id, teacher_id, role) VALUES ($1, $2, $3)',
        [id, assistantId, 'assistant']
      );
    }

    await client.query('COMMIT');
    const updatedClass = await client.query(
      `
      SELECT c.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'firstname', t.firstname,
              'surname', t.surname,
              'class_role', ct.role
            )
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
    if (
      error.message.includes('Selected teacher is already assigned') ||
      error.message.includes('Selected assistant is already assigned') ||
      error.message.includes('Assistant cannot be the same') ||
      error.message.includes('Missing required field') ||
      error.message.includes('Invalid age range values') ||
      error.message.includes('Missing required fields')
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to update class',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
