import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq, gt, gte, lt, lte, ne, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { categoryPresentations } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.put('/categories/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { category, name, age_group, display_order, notes } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid presentation ID' });
    }

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

    const currentPresentation = existsResult[0];
    const isReordering =
      display_order !== undefined && display_order !== currentPresentation.displayOrder;

    if (category !== undefined && typeof category !== 'string') {
      return res.status(400).json({ error: 'Category must be a string' });
    }
    if (age_group !== undefined && typeof age_group !== 'string') {
      return res.status(400).json({ error: 'Age group must be a string' });
    }
    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    if (display_order !== undefined && (typeof display_order !== 'number' || display_order < 1)) {
      return res.status(400).json({ error: 'Display order must be a positive number' });
    }

    const result = await db.transaction(async (tx) => {
      if (isReordering) {
        const newCategory = category !== undefined ? category : currentPresentation.category;
        const newAgeGroup = age_group !== undefined ? age_group : currentPresentation.ageGroup;
        const oldCategory = currentPresentation.category;
        const oldAgeGroup = currentPresentation.ageGroup;
        const oldOrder = currentPresentation.displayOrder;
        const newOrder = display_order;

        if (newCategory !== oldCategory || newAgeGroup !== oldAgeGroup) {
          await tx
            .update(categoryPresentations)
            .set({ displayOrder: sql`-(${categoryPresentations.displayOrder} - 1)` })
            .where(
              and(
                eq(categoryPresentations.category, oldCategory),
                eq(categoryPresentations.ageGroup, oldAgeGroup),
                gt(categoryPresentations.displayOrder, oldOrder),
                ne(categoryPresentations.id, id)
              )
            );

          await tx
            .update(categoryPresentations)
            .set({ displayOrder: sql`-${categoryPresentations.displayOrder}` })
            .where(
              and(
                eq(categoryPresentations.category, oldCategory),
                eq(categoryPresentations.ageGroup, oldAgeGroup),
                lt(categoryPresentations.displayOrder, 0),
                ne(categoryPresentations.id, id)
              )
            );

          await tx
            .update(categoryPresentations)
            .set({ displayOrder: sql`-(${categoryPresentations.displayOrder} + 1)` })
            .where(
              and(
                eq(categoryPresentations.category, newCategory),
                eq(categoryPresentations.ageGroup, newAgeGroup),
                gte(categoryPresentations.displayOrder, newOrder),
                ne(categoryPresentations.id, id)
              )
            );

          await tx
            .update(categoryPresentations)
            .set({ displayOrder: sql`-${categoryPresentations.displayOrder}` })
            .where(
              and(
                eq(categoryPresentations.category, newCategory),
                eq(categoryPresentations.ageGroup, newAgeGroup),
                lt(categoryPresentations.displayOrder, 0),
                ne(categoryPresentations.id, id)
              )
            );
        } else {
          await tx
            .update(categoryPresentations)
            .set({ displayOrder: -999999 })
            .where(eq(categoryPresentations.id, id));

          if (newOrder > oldOrder) {
            await tx
              .update(categoryPresentations)
              .set({ displayOrder: sql`-(${categoryPresentations.displayOrder} - 1)` })
              .where(
                and(
                  eq(categoryPresentations.category, newCategory),
                  eq(categoryPresentations.ageGroup, newAgeGroup),
                  gt(categoryPresentations.displayOrder, oldOrder),
                  lte(categoryPresentations.displayOrder, newOrder),
                  ne(categoryPresentations.id, id)
                )
              );

            await tx
              .update(categoryPresentations)
              .set({ displayOrder: sql`-${categoryPresentations.displayOrder}` })
              .where(
                and(
                  eq(categoryPresentations.category, newCategory),
                  eq(categoryPresentations.ageGroup, newAgeGroup),
                  lt(categoryPresentations.displayOrder, 0),
                  ne(categoryPresentations.id, id)
                )
              );
          } else if (newOrder < oldOrder) {
            await tx
              .update(categoryPresentations)
              .set({ displayOrder: sql`-(${categoryPresentations.displayOrder} + 1)` })
              .where(
                and(
                  eq(categoryPresentations.category, newCategory),
                  eq(categoryPresentations.ageGroup, newAgeGroup),
                  gte(categoryPresentations.displayOrder, newOrder),
                  lt(categoryPresentations.displayOrder, oldOrder),
                  ne(categoryPresentations.id, id)
                )
              );

            await tx
              .update(categoryPresentations)
              .set({ displayOrder: sql`-${categoryPresentations.displayOrder}` })
              .where(
                and(
                  eq(categoryPresentations.category, newCategory),
                  eq(categoryPresentations.ageGroup, newAgeGroup),
                  lt(categoryPresentations.displayOrder, 0),
                  ne(categoryPresentations.id, id)
                )
              );
          }
        }
      }

      const updates = {};
      if (category !== undefined) updates.category = category;
      if (age_group !== undefined) updates.ageGroup = age_group;
      if (name !== undefined) updates.name = name;
      if (notes !== undefined) updates.notes = notes || null;
      if (display_order !== undefined) updates.displayOrder = display_order;

      if (Object.keys(updates).length > 0) {
        await tx.update(categoryPresentations).set(updates).where(eq(categoryPresentations.id, id));
      }

      const rows = await tx
        .select({
          id: categoryPresentations.id,
          category: categoryPresentations.category,
          name: categoryPresentations.name,
          age_group: categoryPresentations.ageGroup,
          display_order: categoryPresentations.displayOrder,
          notes: categoryPresentations.notes,
          created_at: categoryPresentations.createdAt,
        })
        .from(categoryPresentations)
        .where(eq(categoryPresentations.id, id));

      return rows[0];
    });

    res.json(result);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'A presentation with this category and display order already exists',
      });
    }
    console.error('Error updating category presentation:', error);
    res.status(500).json({ error: 'Failed to update category presentation' });
  }
});

export default router;
