import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { childParents, children, classChildren, classes, users } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import validation from './validation.js';
const { validateChild, validateParentIds } = validation;

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { firstname, surname, date_of_birth, parent_ids, notes, class_id } = req.body;

    // Validate input
    const validationErrors = validateChild(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // For parents, force parent_ids to their own ID
    const actualParentIds = req.user.role === 'parent' ? [req.user.id] : parent_ids;

    // Verify if admin/teacher or parent is creating for themselves
    if (req.user.role === 'parent' && (!actualParentIds || actualParentIds[0] !== req.user.id)) {
      return res.status(403).json({ error: 'Parents can only add their own children' });
    }

    const parentIdErrors = validateParentIds(actualParentIds, true);
    if (parentIdErrors.length > 0) {
      return res.status(400).json({ errors: parentIdErrors });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const newChild = await db.transaction(async (tx) => {
      const childResult = await tx
        .insert(children)
        .values({ firstname, surname, dateOfBirth: date_of_birth, notes })
        .returning();

      const child = childResult[0];

      const childAge = Math.floor(
        (new Date() - new Date(date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)
      );

      let assignedClassId;
      if (class_id) {
        // Verify the provided class exists and the age is appropriate
        const classResult = await tx
          .select({ id: classes.id })
          .from(classes)
          .where(and(eq(classes.id, class_id), sql`${childAge} between ${classes.minAge} and ${classes.maxAge}`));

        if (classResult.length === 0) {
          return { error: 'selectedClassNotSuitable' };
        }
        assignedClassId = class_id;
      } else {
        // Auto-assign class based on age
        const classResult = await tx
          .select({ id: classes.id })
          .from(classes)
          .where(sql`${childAge} between ${classes.minAge} and ${classes.maxAge}`)
          .limit(1);

        if (classResult.length === 0) {
          return { error: 'noSuitableClass' };
        }
        assignedClassId = classResult[0].id;
      }

      await tx.insert(classChildren).values({ classId: assignedClassId, childId: child.id });

      const validParents = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, 'parent'), inArray(users.id, actualParentIds)));
      if (validParents.length !== actualParentIds.length) {
        return { error: 'invalidParentIds' };
      }

      await tx
        .insert(childParents)
        .values(actualParentIds.map((parentId) => ({ childId: child.id, parentId })));

      return { child };
    });

    if (newChild.error === 'selectedClassNotSuitable') {
      return res.status(400).json({
        error: 'selectedClassNotSuitable',
        details: "The selected class is not suitable for the child's age",
      });
    }
    if (newChild.error === 'noSuitableClass') {
      return res.status(400).json({ error: 'noSuitableClass', details: null });
    }
    if (newChild.error === 'invalidParentIds') {
      return res.status(400).json({ errors: ['One or more parent IDs are invalid'] });
    }

    res.status(201).json(newChild.child);
  } catch (err) {
    console.error('Error creating child:', err);
    res.status(500).json({ error: 'Failed to create child record' });
  }
});

export default router;
