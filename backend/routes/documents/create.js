import { Router } from 'express';
const router = Router();
import console from 'console';
import authenticateToken from '../../middleware/auth.js';
import { executeQuery } from '../../utils/dbQuery.js';
import { validateDocument, canAccessDocumentByIds, ensureChildInClass } from './validation.js';

// Create a new document
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, file_url, file_name, mime_type, size_bytes, class_id, child_id } =
      req.body;

    const validationErrors = validateDocument(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const canUpload = await canAccessDocumentByIds(req.user.id, req.user.role, child_id, class_id);
    if (!canUpload) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const childInClass = await ensureChildInClass(child_id, class_id);
    if (!childInClass) {
      return res.status(400).json({ error: 'Child is not assigned to this class' });
    }

    // Use executeQuery for better serverless retry handling
    const result = await executeQuery(
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

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating document:', err);
    const statusCode = err.code === 'ECONNREFUSED' || err.message.includes('timeout') ? 503 : 500;
    res.status(statusCode).json({
      error: 'Failed to create document',
      details: err.message,
    });
  }
});

export default router;
