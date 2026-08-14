import { Router } from 'express';
const router = Router();
import console from 'console';
import authenticateToken from '#backend/middleware/auth.js';
import { db } from '#backend/config/database.js';
import { documents } from '#backend/db/schema.js';
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

    const result = await db
      .insert(documents)
      .values({
        title,
        description: description || null,
        fileUrl: file_url,
        fileName: file_name || null,
        mimeType: mime_type || null,
        sizeBytes: size_bytes !== undefined ? size_bytes : null,
        classId: class_id || null,
        childId: child_id || null,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (err) {
    console.error('Error creating document:', err);
    const statusCode = err.code === 'ECONNREFUSED' || err.message.includes('timeout') ? 503 : 500;
    res.status(statusCode).json({
      error: 'Failed to create document',
    });
  }
});

export default router;
