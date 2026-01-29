/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Get class history
router.get('/:id/history', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Unauthorized to view class history' });
  }

  try {
    const { id } = req.params;

    // For parents, check if they have a child in this class
    if (req.user.role === 'parent') {
      const parentChildCheck = await pool.query(
        `SELECT 1 FROM class_children cc
         JOIN children ch ON cc.child_id = ch.id
         WHERE cc.class_id = $1 AND ch.parent_id = $2`,
        [id, req.user.id]
      );
      if (parentChildCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await pool.query(
      `
      SELECT ch.*, 
        json_build_object('id', u.id, 'firstname', u.firstname, 'surname', u.surname) as created_by
      FROM class_history ch
      LEFT JOIN users u ON ch.created_by = u.id
      WHERE ch.class_id = $1
      ORDER BY ch.date DESC`,
      [id]
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
