import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { categoryPresentations } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

// Delete a category presentation
router.delete('/categories/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid presentation ID' });
    }

    // Check if presentation exists and get its details
    const existsResult = await db
      .select({
        id: categoryPresentations.id,
        category: categoryPresentations.category,
        ageGroup: categoryPresentations.ageGroup,
        displayOrder: categoryPresentations.displayOrder,
      })
      .from(categoryPresentations)
      .where(eq(categoryPresentations.id, id));
    if (existsResult.length === 0) {
      return res.status(404).json({ error: 'Category presentation not found' });
    }

    const { category, ageGroup, displayOrder } = existsResult[0];

    await db.transaction(async (tx) => {
      await tx.delete(categoryPresentations).where(eq(categoryPresentations.id, id));

      await tx
        .update(categoryPresentations)
        .set({ displayOrder: sql`-(${categoryPresentations.displayOrder} - 1)` })
        .where(
          and(
            eq(categoryPresentations.category, category),
            eq(categoryPresentations.ageGroup, ageGroup),
            gt(categoryPresentations.displayOrder, displayOrder)
          )
        );

      await tx
        .update(categoryPresentations)
        .set({ displayOrder: sql`-${categoryPresentations.displayOrder}` })
        .where(
          and(
            eq(categoryPresentations.category, category),
            eq(categoryPresentations.ageGroup, ageGroup),
            lt(categoryPresentations.displayOrder, 0)
          )
        );
    });

    res.json({ message: 'Category presentation deleted successfully' });
  } catch (error) {
    console.error('Error deleting category presentation:', error);
    res.status(500).json({ error: 'Failed to delete category presentation' });
  }
});

export default router;
