import { Router } from 'express';
const router = Router();
import console from 'console';
import { eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { presentations } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import validation from './validation.js';
const { canEditChildpresentation, normalizeDisplayOrder } = validation;

// Delete a presentation entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.transaction(async (tx) => {
      const presentationResult = await tx
        .select({ childId: presentations.childId, category: presentations.category })
        .from(presentations)
        .where(eq(presentations.id, id));
      if (presentationResult.length === 0) {
        return { status: 404, body: { error: 'presentation not found' } };
      }

      const childId = presentationResult[0].childId;
      const category = presentationResult[0].category;

      // Check if user can edit this child's presentation
      const canEdit = await canEditChildpresentation(req.user.id, req.user.role, childId);
      if (!canEdit) {
        return {
          status: 403,
          body: { error: 'You do not have permission to delete this presentation entry' },
        };
      }

      // Delete the presentation
      await tx.delete(presentations).where(eq(presentations.id, id));

      await normalizeDisplayOrder(tx, childId, category);

      return { status: 200, body: { message: 'presentation entry deleted successfully' } };
    });

    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error deleting presentation:', err);
    res.status(500).json({ error: 'Failed to delete presentation entry' });
  }
});

export default router;
