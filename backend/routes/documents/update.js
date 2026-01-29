/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { validateDocument, canEditDocumentByIds, ensureChildInClass } = require('./validation');

// Update a document
router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { title, description, file_url, file_name, mime_type, size_bytes, class_id, child_id } =
      req.body;

    const validationErrors = validateDocument(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    await client.query('BEGIN');

    const existingResult = await client.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Document not found' });
    }

    const existing = existingResult.rows[0];

    const canEditExisting = await canEditDocumentByIds(
      req.user.id,
      req.user.role,
      existing.child_id,
      existing.class_id
    );
    if (!canEditExisting) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    const canEditNew = await canEditDocumentByIds(req.user.id, req.user.role, child_id, class_id);
    if (!canEditNew) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    const childInClass = await ensureChildInClass(child_id, class_id);
    if (!childInClass) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Child is not assigned to this class' });
    }

    const result = await client.query(
      `
      UPDATE documents
      SET
        title = $1,
        description = $2,
        file_url = $3,
        file_name = $4,
        mime_type = $5,
        size_bytes = $6,
        class_id = $7,
        child_id = $8,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $9
      WHERE id = $10
      RETURNING *
    `,
      [
        title,
        description || null,
        file_url,
        file_name || null,
        mime_type || null,
        size_bytes !== undefined ? size_bytes : null,
        class_id || null,
        child_id || null,
        req.user.id,
        id,
      ]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  } finally {
    client.release();
  }
});

module.exports = router;
