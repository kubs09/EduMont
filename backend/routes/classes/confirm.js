import { Router } from 'express';
const router = Router();
import { eq, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import {
  childParents,
  classChildren,
  classTeachers,
  classes,
  children,
  users,
} from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

// NOTE: `class_children.confirmed` is not defined in db/schema.js (nor the legacy schema.sql
// baseline) - referenced here as untyped SQL to preserve prior behavior exactly. Flagged for follow-up.
const childrenWithParentsFragment = (confirmedExpr) => sql`COALESCE(
  jsonb_agg(DISTINCT jsonb_build_object(
    'id', ${children.id}, 'firstname', ${children.firstname}, 'surname', ${children.surname},
    'date_of_birth', ${children.dateOfBirth},
    'parents', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', u.id, 'firstname', u.firstname, 'surname', u.surname, 'email', u.email, 'phone', u.phone
      ) ORDER BY u.surname, u.firstname)
      FROM ${childParents} cp JOIN ${users} u ON cp.parent_id = u.id
      WHERE cp.child_id = ${children.id}),
      '[]'::jsonb
    ),
    'confirmed', ${confirmedExpr},
    'age', EXTRACT(YEAR FROM age(CURRENT_DATE, ${children.dateOfBirth}))::integer
  )) FILTER (WHERE ${children.id} IS NOT NULL),
  '[]'::jsonb
)`;

const fetchClassWithChildren = async (tx, classId, confirmedExpr) => {
  const rows = await tx
    .select({
      id: classes.id,
      name: classes.name,
      description: classes.description,
      ageGroup: classes.ageGroup,
      minAge: classes.minAge,
      maxAge: classes.maxAge,
      createdAt: classes.createdAt,
      teachers: sql`COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${users.id}, 'firstname', ${users.firstname}, 'surname', ${users.surname},
          'class_role', ${classTeachers.role}
        )) FILTER (WHERE ${users.id} IS NOT NULL),
        '[]'::jsonb
      )`,
      children: childrenWithParentsFragment(confirmedExpr),
    })
    .from(classes)
    .leftJoin(classTeachers, eq(classes.id, classTeachers.classId))
    .leftJoin(users, eq(classTeachers.teacherId, users.id))
    .leftJoin(classChildren, eq(classes.id, classChildren.classId))
    .leftJoin(children, eq(classChildren.childId, children.id))
    .where(eq(classes.id, classId))
    .groupBy(classes.id);

  return rows[0];
};

// Confirm a child's class assignment
router.post('/:classId/children/:childId/confirm', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only administrators and teachers can confirm class assignments' });
  }

  try {
    const classId = Number(req.params.classId);
    const childId = Number(req.params.childId);

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`UPDATE class_children SET confirmed = TRUE WHERE class_id = ${classId} AND child_id = ${childId}`
      );

      return fetchClassWithChildren(tx, classId, sql`class_children.confirmed`);
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm class assignment' });
  }
});

// Deny a child's class assignment
router.post('/:classId/children/:childId/deny', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only administrators and teachers can deny class assignments' });
  }

  try {
    const classId = Number(req.params.classId);
    const childId = Number(req.params.childId);

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`UPDATE class_children SET confirmed = FALSE WHERE class_id = ${classId} AND child_id = ${childId}`
      );

      return fetchClassWithChildren(tx, classId, sql`COALESCE(class_children.confirmed, false)`);
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm class assignment' });
  }
});

export default router;
