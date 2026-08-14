import { Router } from 'express';
const router = Router();
import { eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { documents } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import console from 'console';
import validation from './validation.js';
const { validateDocument, canEditDocumentByIds, ensureChildInClass } = validation;

// Update a document
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, file_url, file_name, mime_type, size_bytes, class_id, child_id } =
      req.body;

    const validationErrors = validateDocument(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const existingResult = await db
      .select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);
    if (existingResult.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const existing = existingResult[0];

    const canEditExisting = await canEditDocumentByIds(
      req.user.id,
      req.user.role,
      existing.childId,
      existing.classId
    );
    if (!canEditExisting) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const canEditNew = await canEditDocumentByIds(req.user.id, req.user.role, child_id, class_id);
    if (!canEditNew) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const childInClass = await ensureChildInClass(child_id, class_id);
    if (!childInClass) {
      return res.status(400).json({ error: 'Child is not assigned to this class' });
    }

    const result = await db
      .update(documents)
      .set({
        title,
        description: description || null,
        fileUrl: file_url,
        fileName: file_name || null,
        mimeType: mime_type || null,
        sizeBytes: size_bytes !== undefined ? size_bytes : null,
        classId: class_id || null,
        childId: child_id || null,
        updatedAt: new Date(),
        updatedBy: req.user.id,
      })
      .where(eq(documents.id, parseInt(id)))
      .returning();

    res.json(result[0]);
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

export default router;
