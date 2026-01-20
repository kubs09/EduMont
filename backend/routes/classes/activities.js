/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Get next scheduled activities for children in a class
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
          s.duration_hours,
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
