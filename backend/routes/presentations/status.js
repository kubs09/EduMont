import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, asc, desc, eq, gt, lt } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { presentations } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import validation from './validation.js';
const { STATUS_VALUES, canEditChildpresentation, normalizeCategoryOrdering } = validation;

router.put('/children/:childId/:presentationId/status', authenticateToken, async (req, res) => {
  try {
    const childId = Number(req.params.childId);
    const presentationId = Number(req.params.presentationId);
    const { status, notes } = req.body || {};

    if (!Number.isInteger(childId) || !Number.isInteger(presentationId)) {
      return res.status(400).json({ error: 'Invalid child or presentation ID' });
    }

    if (!status || !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes must be a string or null' });
    }
    if (typeof notes === 'string' && notes.length > 1000) {
      return res.status(400).json({ error: 'Notes must not exceed 1000 characters' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, childId);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's presentation" });
    }

    const presentationResult = await db
      .select({ id: presentations.id, category: presentations.category })
      .from(presentations)
      .where(and(eq(presentations.id, presentationId), eq(presentations.childId, childId)));

    if (presentationResult.length === 0) {
      return res.status(404).json({ error: 'presentation not found for this child' });
    }

    const updated = await db.transaction(async (tx) => {
      const result = await tx
        .update(presentations)
        .set({
          status,
          notes: typeof notes === 'string' ? notes : undefined,
          updatedAt: new Date(),
          updatedBy: req.user.id,
        })
        .where(eq(presentations.id, presentationId))
        .returning();

      await normalizeCategoryOrdering(tx, childId, presentationResult[0].category);

      return result[0];
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating presentation status:', error);
    res.status(500).json({ error: 'Failed to update presentation status' });
  }
});

router.put('/children/:childId/:presentationId/reorder', authenticateToken, async (req, res) => {
  try {
    const childId = Number(req.params.childId);
    const presentationId = Number(req.params.presentationId);
    const { direction } = req.body || {};

    if (!Number.isInteger(childId) || !Number.isInteger(presentationId)) {
      return res.status(400).json({ error: 'Invalid child or presentation ID' });
    }

    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction. Must be "up" or "down"' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, childId);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's presentation" });
    }

    const presentationResult = await db
      .select({
        id: presentations.id,
        category: presentations.category,
        displayOrder: presentations.displayOrder,
      })
      .from(presentations)
      .where(and(eq(presentations.id, presentationId), eq(presentations.childId, childId)));

    if (presentationResult.length === 0) {
      return res.status(404).json({ error: 'presentation not found for this child' });
    }

    const currentPresentation = presentationResult[0];
    const currentOrder = currentPresentation.displayOrder;

    const result = await db.transaction(async (tx) => {
      if (direction === 'up') {
        const adjacentResult = await tx
          .select({ id: presentations.id })
          .from(presentations)
          .where(
            and(
              eq(presentations.childId, childId),
              eq(presentations.category, currentPresentation.category),
              lt(presentations.displayOrder, currentOrder)
            )
          )
          .orderBy(desc(presentations.displayOrder))
          .limit(1);

        if (adjacentResult.length === 0) {
          return { error: 'Cannot move up: already at the top' };
        }

        const adjacentId = adjacentResult[0].id;

        await tx
          .update(presentations)
          .set({ displayOrder: currentOrder - 1, updatedAt: new Date(), updatedBy: req.user.id })
          .where(eq(presentations.id, presentationId));

        await tx
          .update(presentations)
          .set({ displayOrder: currentOrder, updatedAt: new Date(), updatedBy: req.user.id })
          .where(eq(presentations.id, adjacentId));
      } else {
        const adjacentResult = await tx
          .select({ id: presentations.id })
          .from(presentations)
          .where(
            and(
              eq(presentations.childId, childId),
              eq(presentations.category, currentPresentation.category),
              gt(presentations.displayOrder, currentOrder)
            )
          )
          .orderBy(asc(presentations.displayOrder))
          .limit(1);

        if (adjacentResult.length === 0) {
          return { error: 'Cannot move down: already at the bottom' };
        }

        const adjacentId = adjacentResult[0].id;

        await tx
          .update(presentations)
          .set({ displayOrder: currentOrder + 1, updatedAt: new Date(), updatedBy: req.user.id })
          .where(eq(presentations.id, presentationId));

        await tx
          .update(presentations)
          .set({ displayOrder: currentOrder, updatedAt: new Date(), updatedBy: req.user.id })
          .where(eq(presentations.id, adjacentId));
      }

      return { success: true };
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: `Presentation moved ${direction}` });
  } catch (error) {
    console.error('Error reordering presentations:', error);
    res.status(500).json({ error: 'Failed to reorder presentations' });
  }
});

export default router;
