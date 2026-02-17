/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Delete a category presentation
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid presentation ID' });
    }

    // Check if presentation exists
    const existsQuery = 'SELECT id FROM category_presentations WHERE id = $1';
    const existsResult = await pool.query(existsQuery, [id]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category presentation not found' });
    }

    // Delete the presentation
    const deleteQuery = 'DELETE FROM category_presentations WHERE id = $1';
    await pool.query(deleteQuery, [id]);

    res.json({ message: 'Category presentation deleted successfully' });
  } catch (error) {
    console.error('Error deleting category presentation:', error);
    res.status(500).json({ error: 'Failed to delete category presentation' });
  }
});

module.exports = router;
