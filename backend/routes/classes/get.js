import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, asc, desc, eq, exists, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import {
  childParents,
  classChildren,
  classTeachers,
  classes,
  children,
  presentations,
  users,
} from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

const teachersListFragment = sql`COALESCE(
  (SELECT json_agg(json_build_object(
    'id', u.id, 'firstname', u.firstname, 'surname', u.surname,
    'class_role', ct.role, 'permission_requested', ct.permission_requested
  ))
  FROM ${classTeachers} ct JOIN ${users} u ON ct.teacher_id = u.id
  WHERE ct.class_id = classes.id),
  '[]'
)`;

const childrenWithParentsFragment = sql`COALESCE(
  (SELECT json_agg(json_build_object(
    'id', ch.id, 'firstname', ch.firstname, 'surname', ch.surname, 'date_of_birth', ch.date_of_birth,
    'parents', COALESCE(
      (SELECT json_agg(json_build_object(
        'id', u.id, 'firstname', u.firstname, 'surname', u.surname, 'email', u.email, 'phone', u.phone
      ) ORDER BY u.surname, u.firstname)
      FROM ${childParents} cp JOIN ${users} u ON cp.parent_id = u.id
      WHERE cp.child_id = ch.id),
      '[]'
    ),
    'age', EXTRACT(YEAR FROM age(CURRENT_DATE, ch.date_of_birth))::integer
  ))
  FROM ${classChildren} cc JOIN ${children} ch ON cc.child_id = ch.id
  WHERE cc.class_id = classes.id),
  '[]'
)`;

const childrenBasicFragment = (userId) => sql`COALESCE(
  (SELECT json_agg(json_build_object('id', ch.id, 'firstname', ch.firstname, 'surname', ch.surname))
  FROM ${classChildren} cc JOIN ${children} ch ON cc.child_id = ch.id
  WHERE cc.class_id = classes.id AND EXISTS (
    SELECT 1 FROM ${childParents} cp WHERE cp.child_id = ch.id AND cp.parent_id = ${userId}
  )),
  '[]'
)`;

router.get('/', auth, async (req, res) => {
  try {
    let result;

    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      let query = db
        .select({
          id: classes.id,
          name: classes.name,
          description: classes.description,
          age_group: classes.ageGroup,
          min_age: classes.minAge,
          max_age: classes.maxAge,
          teachers: teachersListFragment,
          children: childrenWithParentsFragment,
        })
        .from(classes);

      if (req.user.role === 'teacher') {
        query = query.where(
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

      result = await query.orderBy(asc(classes.name));
    } else if (req.user.role === 'parent') {
      result = await db
        .select({
          id: classes.id,
          name: classes.name,
          description: classes.description,
          age_group: classes.ageGroup,
          min_age: classes.minAge,
          max_age: classes.maxAge,
          teachers: teachersListFragment,
          children: childrenBasicFragment(req.user.id),
        })
        .from(classes)
        .where(
          exists(
            db
              .select({ id: classChildren.classId })
              .from(classChildren)
              .innerJoin(children, eq(classChildren.childId, children.id))
              .where(
                and(
                  eq(classChildren.classId, classes.id),
                  exists(
                    db
                      .select({ id: childParents.childId })
                      .from(childParents)
                      .where(
                        and(
                          eq(childParents.childId, children.id),
                          eq(childParents.parentId, req.user.id)
                        )
                      )
                  )
                )
              )
          )
        )
        .orderBy(asc(classes.name));
    } else {
      result = [];
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch classes',
      details: error.message,
    });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const classId = Number(id);

    if (req.user.role === 'parent') {
      const parentChildCheck = await db
        .select({ id: classChildren.classId })
        .from(classChildren)
        .innerJoin(children, eq(classChildren.childId, children.id))
        .where(
          and(
            eq(classChildren.classId, classId),
            exists(
              db
                .select({ id: childParents.childId })
                .from(childParents)
                .where(
                  and(eq(childParents.childId, children.id), eq(childParents.parentId, req.user.id))
                )
            )
          )
        );
      if (parentChildCheck.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const rows = await db
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
            'class_role', ${classTeachers.role}, 'permission_requested', ${classTeachers.permissionRequested}
          )) FILTER (WHERE ${users.id} IS NOT NULL),
          '[]'::jsonb
        )`,
        children: childrenWithParentsFragment,
      })
      .from(classes)
      .leftJoin(classTeachers, eq(classes.id, classTeachers.classId))
      .leftJoin(users, eq(classTeachers.teacherId, users.id))
      .where(eq(classes.id, classId))
      .groupBy(classes.id);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ error: 'Failed to fetch class details' });
  }
});

router.get('/:id/next-presentations', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const classId = Number(id);

    if (req.user.role === 'parent') {
      const parentChildCheck = await db
        .select({ id: classChildren.classId })
        .from(classChildren)
        .innerJoin(children, eq(classChildren.childId, children.id))
        .where(
          and(
            eq(classChildren.classId, classId),
            exists(
              db
                .select({ id: childParents.childId })
                .from(childParents)
                .where(
                  and(eq(childParents.childId, children.id), eq(childParents.parentId, req.user.id))
                )
            )
          )
        );
      if (parentChildCheck.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await db
      .select({
        id: presentations.id,
        child_id: presentations.childId,
        class_id: presentations.classId,
        name: presentations.name,
        category: presentations.category,
        status: presentations.status,
        notes: presentations.notes,
        created_at: presentations.createdAt,
        updated_at: presentations.updatedAt,
        class_name: classes.name,
        child_firstname: children.firstname,
        child_surname: children.surname,
      })
      .from(presentations)
      .innerJoin(classes, eq(presentations.classId, classes.id))
      .innerJoin(children, eq(presentations.childId, children.id))
      .where(and(eq(presentations.classId, classId), eq(presentations.status, 'to be presented')))
      .orderBy(desc(presentations.createdAt));

    res.json(result);
  } catch (error) {
    console.error('Error fetching next presentations:', error);
    res.status(500).json({ error: 'Failed to fetch next presentations' });
  }
});

router.get('/by-age/:age', auth, async (req, res) => {
  try {
    const { age } = req.params;
    const ageNumber = parseInt(age, 10);

    if (isNaN(ageNumber) || ageNumber < 0) {
      return res.status(400).json({ error: 'Invalid age provided' });
    }

    const result = await db
      .select({
        id: classes.id,
        name: classes.name,
        description: classes.description,
        min_age: classes.minAge,
        max_age: classes.maxAge,
      })
      .from(classes)
      .where(sql`${ageNumber} between ${classes.minAge} and ${classes.maxAge}`)
      .orderBy(asc(classes.name));

    res.json(result);
  } catch (error) {
    console.error('Error fetching classes by age:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

export default router;
