import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { categoryPresentations } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

// Create a new category presentation
router.post('/categories', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { category, name, age_group, display_order, notes } = req.body;

    // Validate required fields
    if (!category || !name || !age_group || display_order === undefined) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: category, name, age_group, display_order' });
    }

    // Validate category and name are strings
    if (typeof category !== 'string' || typeof name !== 'string') {
      return res.status(400).json({ error: 'Category and name must be strings' });
    }

    // Validate display_order is a number
    if (typeof display_order !== 'number' || display_order < 1) {
      return res.status(400).json({ error: 'Display order must be a positive number' });
    }

    const result = await db.transaction(async (tx) => {
      // Shift down existing presentations at and after the display_order
      // Step 1: Convert to temporary negative values to avoid constraint conflicts
      await tx
        .update(categoryPresentations)
        .set({ displayOrder: sql`-(${categoryPresentations.displayOrder} + 1)` })
        .where(
          and(
            eq(categoryPresentations.category, category),
            eq(categoryPresentations.ageGroup, age_group),
            gte(categoryPresentations.displayOrder, display_order)
          )
        );

      // Step 2: Convert negative values back to positive
      await tx
        .update(categoryPresentations)
        .set({ displayOrder: sql`-${categoryPresentations.displayOrder}` })
        .where(
          and(
            eq(categoryPresentations.category, category),
            eq(categoryPresentations.ageGroup, age_group),
            lt(categoryPresentations.displayOrder, 0)
          )
        );

      // Insert the new presentation
      const inserted = await tx
        .insert(categoryPresentations)
        .values({
          category,
          name,
          ageGroup: age_group,
          displayOrder: display_order,
          notes: notes || null,
        })
        .returning();

      return inserted[0];
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'A presentation with this category and display order already exists',
      });
    }
    console.error('Error creating category presentation:', error);
    res.status(500).json({ error: 'Failed to create category presentation' });
  }
});

export default router;
