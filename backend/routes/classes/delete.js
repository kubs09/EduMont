/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

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

module.exports = router;
