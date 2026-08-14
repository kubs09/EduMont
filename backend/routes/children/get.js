import { Router } from 'express';
const router = Router();
import process from 'process';
import { and, asc, desc, eq, exists, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import authenticateToken from '#backend/middleware/auth.js';
import {
  childParents,
  children,
  classChildren,
  classTeachers,
  classes,
  presentations,
  presentationPermissions,
  users,
} from '#backend/db/schema.js';

const buildParentAggregation = () => sql`
  COALESCE(
    (
      SELECT json_agg(
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
      WHERE cp.child_id = ${children.id}
    ),
    '[]'
  )
`;

const buildChildBaseSelect = () =>
  db
    .select({
      id: children.id,
      firstname: children.firstname,
      surname: children.surname,
      date_of_birth: children.dateOfBirth,
      notes: children.notes,
      parents: buildParentAggregation(),
      class_id: classes.id,
      class_name: classes.name,
    })
    .from(children)
    .leftJoin(classChildren, eq(children.id, classChildren.childId))
    .leftJoin(classes, eq(classChildren.classId, classes.id));

router.get('/', authenticateToken, async (req, res) => {
  try {
    let resultQuery = buildChildBaseSelect();

    if (req.user.role === 'parent') {
      resultQuery = resultQuery.where(
        exists(
          db
            .select({ id: childParents.childId })
            .from(childParents)
            .where(
              and(eq(childParents.childId, children.id), eq(childParents.parentId, req.user.id))
            )
        )
      );
    } else if (req.user.role === 'teacher') {
      resultQuery = resultQuery.where(
        exists(
          db
            .select({ id: classTeachers.classId })
            .from(classTeachers)
            .where(
              and(eq(classTeachers.classId, classes.id), eq(classTeachers.teacherId, req.user.id))
            )
        )
      );
    }

    const result = await resultQuery.orderBy(asc(children.surname));

    if (result.length === 0) {
      return res.json([]);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch children',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await buildChildBaseSelect().where(eq(children.id, Number(id)));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const child = result[0];

    if (req.user.role === 'parent' && !child.parents.some((parent) => parent.id === req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(child);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch child',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

router.get('/:id/classes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .select({
        id: classes.id,
        name: classes.name,
        description: classes.description,
        teacher_firstname: users.firstname,
        teacher_surname: users.surname,
      })
      .from(classChildren)
      .innerJoin(classes, eq(classChildren.classId, classes.id))
      .leftJoin(classTeachers, eq(classes.id, classTeachers.classId))
      .leftJoin(users, eq(classTeachers.teacherId, users.id))
      .where(eq(classChildren.childId, Number(id)))
      .orderBy(asc(classes.name));

    res.json(result || []);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch child classes',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

router.get('/:id/presentations', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const classResult = await db
      .select({ classId: classChildren.classId })
      .from(classChildren)
      .where(eq(classChildren.childId, Number(id)))
      .orderBy(desc(classChildren.classId))
      .limit(1);

    if (classResult.length === 0) {
      return res.status(404).json({ error: 'Child class not found' });
    }

    const classId = classResult[0].classId;

    if (req.user.role === 'admin') {
      const permissionResult = await db
        .select({ id: presentationPermissions.id })
        .from(presentationPermissions)
        .where(
          and(
            eq(presentationPermissions.classId, classId),
            eq(presentationPermissions.adminId, req.user.id),
            eq(presentationPermissions.granted, true)
          )
        )
        .limit(1);

      if (permissionResult.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to view presentations' });
      }
    } else if (req.user.role === 'teacher') {
      const teacherResult = await db
        .select({ id: classTeachers.classId })
        .from(classTeachers)
        .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, req.user.id)))
        .limit(1);

      if (teacherResult.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (req.user.role === 'parent') {
      const parentResult = await db
        .select({ id: childParents.childId })
        .from(childParents)
        .where(and(eq(childParents.childId, Number(id)), eq(childParents.parentId, req.user.id)))
        .limit(1);

      if (parentResult.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await db
      .select({
        id: presentations.id,
        name: presentations.name,
        category: presentations.category,
        display_order: presentations.displayOrder,
        status: presentations.status,
        notes: presentations.notes,
        child_id: presentations.childId,
        class_id: presentations.classId,
      })
      .from(presentations)
      .where(eq(presentations.childId, Number(id)))
      .orderBy(asc(presentations.category), asc(presentations.displayOrder));

    res.json(result || []);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch child presentations',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

export default router;
