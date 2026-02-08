/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

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

// Create a new class
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can create classes' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, min_age, max_age, teacherId, assistantId } = req.body;
    const classResult = await client.query(
      'INSERT INTO classes (name, description, min_age, max_age) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, description, min_age, max_age]
    );
    const classId = classResult.rows[0].id;

    if (!teacherId) {
      throw new Error('Missing required field: teacherId is required');
    }

    if (assistantId && assistantId === teacherId) {
      throw new Error('Assistant cannot be the same as the main teacher');
    }

    const assignedTeacher = await client.query(
      'SELECT class_id FROM class_teachers WHERE teacher_id = $1 LIMIT 1',
      [teacherId]
    );

    if (assignedTeacher.rows.length > 0) {
      throw new Error('Selected teacher is already assigned to another class');
    }

    if (assistantId) {
      const assignedAssistant = await client.query(
        'SELECT class_id FROM class_teachers WHERE teacher_id = $1 LIMIT 1',
        [assistantId]
      );

      if (assignedAssistant.rows.length > 0) {
        throw new Error('Selected assistant is already assigned to another class');
      }
    }

    const teacherParams = [classId, teacherId];
    await client.query(
      'INSERT INTO class_teachers (class_id, teacher_id, role) VALUES ($1, $2, $3)',
      [...teacherParams, 'teacher']
    );

    if (assistantId) {
      await client.query(
        'INSERT INTO class_teachers (class_id, teacher_id, role) VALUES ($1, $2, $3)',
        [classId, assistantId, 'assistant']
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: classId });
  } catch (error) {
    await client.query('ROLLBACK');
    if (
      error.message.includes('Selected teacher is already assigned') ||
      error.message.includes('Selected assistant is already assigned') ||
      error.message.includes('Assistant cannot be the same') ||
      error.message.includes('Missing required field')
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to create class',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Auto-assign children to classes based on age
router.post('/auto-assign', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can trigger auto-assignment' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // First, clear all previous assignments
    await client.query('DELETE FROM class_children');

    // Get all children who aren't assigned to any class
    const childrenQuery = `
      SELECT id, date_of_birth 
      FROM children ch
      WHERE NOT EXISTS (
        SELECT 1 FROM class_children cc 
        WHERE cc.child_id = ch.id
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
          `INSERT INTO class_children (class_id, child_id, created_at) 
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (class_id, child_id) 
           DO UPDATE SET created_at = CURRENT_TIMESTAMP`,
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

module.exports = router;
