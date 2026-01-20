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

// Auto-assign children to classes based on age
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

module.exports = router;
