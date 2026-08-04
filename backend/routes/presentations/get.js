import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, asc, eq, exists } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '#backend/config/database.js';
import { childParents, classChildren, classTeachers, classes, children, presentations, users } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import validationModule from './validation.js';

const { canAccessChildpresentation } = validationModule;

const creator = alias(users, 'creator');
const updater = alias(users, 'updater');

const presentationSelection = {
  id: presentations.id,
  child_id: presentations.childId,
  class_id: presentations.classId,
  name: presentations.name,
  category: presentations.category,
  display_order: presentations.displayOrder,
  status: presentations.status,
  notes: presentations.notes,
  created_at: presentations.createdAt,
  updated_at: presentations.updatedAt,
  class_name: classes.name,
  child_firstname: children.firstname,
  child_surname: children.surname,
  created_by_firstname: creator.firstname,
  created_by_surname: creator.surname,
  updated_by_firstname: updater.firstname,
  updated_by_surname: updater.surname,
};

const buildPresentationQuery = () =>
  db
    .select(presentationSelection)
    .from(presentations)
    .innerJoin(classes, eq(presentations.classId, classes.id))
    .innerJoin(children, eq(presentations.childId, children.id))
    .leftJoin(creator, eq(presentations.createdBy, creator.id))
    .leftJoin(updater, eq(presentations.updatedBy, updater.id));

const STATUS_VALUES = [
  'prerequisites not met',
  'to be presented',
  'presented',
  'practiced',
  'mastered',
];

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const conditions = [];

    if (req.user.role === 'teacher') {
      conditions.push(
        exists(
          db
            .select({ id: classTeachers.classId })
            .from(classTeachers)
            .where(
              and(eq(classTeachers.classId, presentations.classId), eq(classTeachers.teacherId, req.user.id))
            )
        )
      );
    }

    if (status) {
      conditions.push(eq(presentations.status, status));
    }

    let query = buildPresentationQuery();
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(asc(presentations.category), asc(presentations.displayOrder));
    res.json(result);
  } catch (err) {
    console.error('Error fetching all presentations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/child/:childId', authenticateToken, async (req, res) => {
  try {
    const childId = Number(req.params.childId);
    const { status } = req.query;

    if (!Number.isInteger(childId)) {
      return res.status(400).json({ error: 'Invalid child ID' });
    }

    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const hasAccess = await canAccessChildpresentation(req.user.id, req.user.role, childId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conditions = [eq(presentations.childId, childId)];
    if (status) {
      conditions.push(eq(presentations.status, status));
    }

    const result = await buildPresentationQuery()
      .where(and(...conditions))
      .orderBy(asc(presentations.category), asc(presentations.displayOrder));
    res.json(result);
  } catch (err) {
    console.error('Error fetching presentation:', err);
    res.status(500).json({ error: 'Failed to fetch presentation' });
  }
});

router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const { status } = req.query;

    if (!Number.isInteger(classId)) {
      return res.status(400).json({ error: 'Invalid class ID' });
    }

    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (req.user.role === 'admin') {
      // full access
    } else if (req.user.role === 'teacher') {
      const teacherClassResult = await db
        .select({ classId: classTeachers.classId })
        .from(classTeachers)
        .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, req.user.id)));
      if (teacherClassResult.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'parent') {
      const parentChildResult = await db
        .select({ classId: classChildren.classId })
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
      if (parentChildResult.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conditions = [eq(presentations.classId, classId)];

    if (req.user.role === 'parent') {
      conditions.push(
        exists(
          db
            .select({ id: childParents.childId })
            .from(childParents)
            .where(
              and(eq(childParents.childId, children.id), eq(childParents.parentId, req.user.id))
            )
        )
      );
    }

    if (status) {
      conditions.push(eq(presentations.status, status));
    }

    const result = await buildPresentationQuery()
      .where(and(...conditions))
      .orderBy(
        asc(presentations.category),
        asc(presentations.displayOrder),
        asc(children.surname),
        asc(children.firstname)
      );
    res.json(result);
  } catch (err) {
    console.error('Error fetching class presentation:', err);
    res.status(500).json({ error: 'Failed to fetch class presentation' });
  }
});

export default router;
