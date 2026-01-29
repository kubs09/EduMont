/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { validateDocument, canEditDocumentByIds, ensureChildInClass } = require('./validation');

// Create a new document
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, description, file_url, file_name, mime_type, size_bytes, class_id, child_id } =
      req.body;

    const validationErrors = validateDocument(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const canEdit = await canEditDocumentByIds(req.user.id, req.user.role, child_id, class_id);
    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const childInClass = await ensureChildInClass(child_id, class_id);
    if (!childInClass) {
      return res.status(400).json({ error: 'Child is not assigned to this class' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `
      INSERT INTO documents (
        title,
        description,
        file_url,
        file_name,
        mime_type,
        size_bytes,
        class_id,
        child_id,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
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
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating document:', err);
    res.status(500).json({ error: 'Failed to create document' });
  } finally {
    client.release();
  }
});

module.exports = router;
