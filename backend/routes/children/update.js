import { Router } from 'express';
const router = Router();
import { and, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import {
  childParents,
  children,
  classChildren,
  classes,
  presentations,
  users,
} from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import validation from './validation.js';
import console from 'console';
const { validateChildUpdate, validateParentIds } = validation;

const toDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return value;
};

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, surname, date_of_birth, parent_ids, notes, class_id } = req.body;

    const childId = Number(id);
    if (!Number.isInteger(childId) || childId <= 0) {
      return res.status(400).json({ error: 'Invalid child identifier' });
    }

    const validationErrors = validateChildUpdate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    if (parent_ids && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can edit parents' });
    }
    if (parent_ids) {
      const parentIdErrors = validateParentIds(parent_ids, true);
      if (parentIdErrors.length > 0) {
        return res.status(400).json({ errors: parentIdErrors });
      }
    }

    const child = await db
      .select({ id: children.id })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);
    if (child.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (req.user.role === 'parent') {
      const parentLink = await db
        .select({ childId: childParents.childId })
        .from(childParents)
        .where(and(eq(childParents.childId, childId), eq(childParents.parentId, req.user.id)))
        .limit(1);
      if (parentLink.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to edit this child' });
      }
    }

    const actualDateOfBirth = toDateString(date_of_birth);

    const normalizedClassId =
      class_id === null || class_id === undefined || class_id === '' ? null : Number(class_id);

    if (
      normalizedClassId !== null &&
      (!Number.isInteger(normalizedClassId) || normalizedClassId <= 0)
    ) {
      return res.status(400).json({ error: 'Invalid class identifier' });
    }

    const updatedChild = await db.transaction(async (tx) => {
      const result = await tx
        .update(children)
        .set({
          firstname,
          surname,
          dateOfBirth: actualDateOfBirth ? new Date(actualDateOfBirth) : undefined,
          notes,
        })
        .where(eq(children.id, childId))
        .returning({
          id: children.id,
          firstname: children.firstname,
          surname: children.surname,
          dateOfBirth: children.dateOfBirth,
          notes: children.notes,
        });

      if (result.length === 0) {
        return null;
      }

      if (parent_ids) {
        const validParents = await tx
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.role, 'parent'), inArray(users.id, parent_ids)));

        if (validParents.length !== parent_ids.length) {
          throw new Error('One or more parent IDs are invalid');
        }

        await tx.delete(childParents).where(eq(childParents.childId, childId));
        await tx.insert(childParents).values(parent_ids.map((parentId) => ({ childId, parentId })));
      }

      if (normalizedClassId !== null) {
        const childAge = Math.floor(
          (new Date() - new Date(actualDateOfBirth || result[0].dateOfBirth)) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        const classResult = await tx
          .select({ id: classes.id })
          .from(classes)
          .where(
            and(
              eq(classes.id, normalizedClassId),
              sql`${childAge} between ${classes.minAge} and ${classes.maxAge}`
            )
          )
          .limit(1);

        if (classResult.length === 0) {
          throw new Error('selectedClassNotSuitable');
        }

        await tx
          .insert(classChildren)
          .values({ childId, classId: normalizedClassId })
          .onConflictDoUpdate({
            target: classChildren.childId,
            set: { classId: normalizedClassId },
          });

        await tx
          .update(presentations)
          .set({ classId: normalizedClassId, updatedAt: new Date() })
          .where(eq(presentations.childId, childId));
      }

      const rows = await tx
        .select({
          id: children.id,
          firstname: children.firstname,
          surname: children.surname,
          dateOfBirth: children.dateOfBirth,
          notes: children.notes,
          classId: classes.id,
          className: classes.name,
          parents: sql`COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', u.id,
                'firstname', u.firstname,
                'surname', u.surname,
                'email', u.email,
                'phone', u.phone
              )
              ORDER BY u.surname, u.firstname
            )
            FROM ${childParents} cp
            JOIN ${users} u ON cp.parent_id = u.id
            WHERE cp.child_id = ${children.id}),
            '[]'
          )`,
        })
        .from(children)
        .leftJoin(classChildren, eq(children.id, classChildren.childId))
        .leftJoin(classes, eq(classChildren.classId, classes.id))
        .where(eq(children.id, childId))
        .limit(1);

      return rows[0] ?? null;
    });

    if (!updatedChild) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json(updatedChild);
  } catch (err) {
    console.error('Error updating child:', err);
    if (err.message === 'One or more parent IDs are invalid') {
      return res.status(400).json({ errors: [err.message] });
    }
    if (err.message === 'selectedClassNotSuitable') {
      return res.status(400).json({
        error: 'selectedClassNotSuitable',
        details: "The selected class is not suitable for the child's age",
      });
    }
    res.status(500).json({ error: 'Failed to update child record' });
  }
});

export default router;
