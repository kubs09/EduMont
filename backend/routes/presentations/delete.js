import { Router } from 'express';
const router = Router();
import console from 'console';
import { eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { presentations } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import validation from './validation.js';
import { publishEvent } from '#backend/utils/realtime.js';
const { canEditChildpresentation, normalizeDisplayOrder } = validation;

// Delete a presentation entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const presentationId = Number(id);
    if (!Number.isInteger(presentationId)) {
      return res.status(400).json({ error: 'Invalid presentation ID' });
    }

    const result = await db.transaction(async (tx) => {
      const presentationResult = await tx
        .select({
          childId: presentations.childId,
          category: presentations.category,
          classId: presentations.classId,
        })
        .from(presentations)
        .where(eq(presentations.id, presentationId));
      if (presentationResult.length === 0) {
        return { status: 404, body: { error: 'presentation not found' } };
      }

      const childId = presentationResult[0].childId;
      const category = presentationResult[0].category;
      const classId = presentationResult[0].classId;

      // Check if user can edit this child's presentation
      const canEdit = await canEditChildpresentation(req.user.id, req.user.role, childId);
      if (!canEdit) {
        return {
          status: 403,
          body: { error: 'You do not have permission to delete this presentation entry' },
        };
      }

      // Delete the presentation
      await tx.delete(presentations).where(eq(presentations.id, presentationId));

      await normalizeDisplayOrder(tx, childId, category);

      return { status: 200, body: { message: 'presentation entry deleted successfully' }, classId };
    });

    if (result.status === 200) {
      publishEvent(`class:${result.classId}`, 'presentation_changed', { classId: result.classId });
    }
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error deleting presentation:', err);
    res.status(500).json({ error: 'Failed to delete presentation entry' });
  }
});

export default router;
