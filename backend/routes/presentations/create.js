import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { categoryPresentations, classChildren, classes, presentations } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import validationModule from './validation.js';
const { validatepresentation, canEditChildpresentation, normalizeCategoryOrdering } =
  validationModule;

// Create a new presentation entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { child_id, class_id, name, category, status, notes, display_order } = req.body;

    const validationErrors = validatepresentation(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, child_id);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's presentation" });
    }

    const result = await db.transaction(async (tx) => {
      const classChildResult = await tx
        .select({ classId: classChildren.classId })
        .from(classChildren)
        .where(and(eq(classChildren.childId, child_id), eq(classChildren.classId, class_id)));

      if (classChildResult.length === 0) {
        return { error: 'Child is not assigned to this class' };
      }

      // Get display_order from category_presentations if not provided
      let finalDisplayOrder = display_order || 0;
      if (category && !display_order) {
        // Get the class's age_group to lookup correct category presentations
        const classResult = await tx
          .select({ ageGroup: classes.ageGroup })
          .from(classes)
          .where(eq(classes.id, class_id));

        if (classResult.length > 0) {
          const ageGroup = classResult[0].ageGroup;
          const orderResult = await tx
            .select({ displayOrder: categoryPresentations.displayOrder })
            .from(categoryPresentations)
            .where(
              and(
                eq(categoryPresentations.category, category),
                eq(categoryPresentations.ageGroup, ageGroup)
              )
            )
            .orderBy(asc(categoryPresentations.displayOrder))
            .limit(1);
          if (orderResult.length > 0) {
            finalDisplayOrder = orderResult[0].displayOrder;
          }
        }
      }

      const inserted = await tx
        .insert(presentations)
        .values({
          childId: child_id,
          classId: class_id,
          name,
          category,
          displayOrder: finalDisplayOrder,
          status: status || 'prerequisites not met',
          notes,
          createdBy: req.user.id,
          updatedBy: req.user.id,
        })
        .returning();

      await normalizeCategoryOrdering(tx, child_id, category);

      return { presentation: inserted[0] };
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.presentation);
  } catch (err) {
    console.error('Error creating presentation:', err);
    res.status(500).json({ error: 'Failed to create presentation entry' });
  }
});

export default router;
