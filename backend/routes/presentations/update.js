import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { classChildren, presentations } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import validationModule from './validation.js';
import { publishEvent } from '#backend/utils/realtime.js';
const { validatepresentation, canEditChildpresentation, normalizeCategoryOrdering } =
  validationModule;

// Update a presentation entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const presentationId = Number(id);
    if (!Number.isInteger(presentationId)) {
      return res.status(400).json({ error: 'Invalid presentation ID' });
    }
    const { child_id, class_id, name, category, status, notes, display_order } = req.body;

    const validationErrors = validatepresentation(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const result = await db.transaction(async (tx) => {
      const presentationResult = await tx
        .select({ childId: presentations.childId, category: presentations.category })
        .from(presentations)
        .where(eq(presentations.id, presentationId));
      if (presentationResult.length === 0) {
        return { status: 404, body: { error: 'presentation not found' } };
      }

      const previousChildId = presentationResult[0].childId;
      const previousCategory = presentationResult[0].category;

      const canEdit = await canEditChildpresentation(req.user.id, req.user.role, child_id);
      if (!canEdit) {
        return {
          status: 403,
          body: { error: "You do not have permission to edit this child's presentation" },
        };
      }

      const classChildResult = await tx
        .select({ classId: classChildren.classId })
        .from(classChildren)
        .where(and(eq(classChildren.childId, child_id), eq(classChildren.classId, class_id)));

      if (classChildResult.length === 0) {
        return { status: 400, body: { error: 'Child is not assigned to this class' } };
      }

      const updated = await tx
        .update(presentations)
        .set({
          childId: child_id,
          classId: class_id,
          name,
          category,
          displayOrder: display_order || 0,
          status,
          notes,
          updatedAt: new Date(),
          updatedBy: req.user.id,
        })
        .where(eq(presentations.id, presentationId))
        .returning();

      await normalizeCategoryOrdering(tx, child_id, category);
      if (previousChildId !== child_id || previousCategory !== category) {
        await normalizeCategoryOrdering(tx, previousChildId, previousCategory);
      }

      return { status: 200, body: updated[0] };
    });

    if (result.status === 200) {
      publishEvent(`class:${class_id}`, 'presentation_changed', { classId: class_id });
    }
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error updating presentation:', err);
    res.status(500).json({ error: 'Failed to update presentation entry' });
  }
});

export default router;
