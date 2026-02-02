/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { canEditDocumentByIds } = require('./validation');

// Delete a document
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const documentResult = await client.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (documentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documentResult.rows[0];

    const canEdit = await canEditDocumentByIds(
      req.user.id,
      req.user.role,
      document.child_id,
      document.class_id
    );
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('DELETE FROM documents WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  } finally {
    client.release();
  }
});

module.exports = router;
