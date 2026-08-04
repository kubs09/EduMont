import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, asc, eq, exists } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { childParents, classChildren, classTeachers, children, presentations } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.get('/class/:id/next-presentations', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const classId = Number(id);

    if (req.user.role === 'teacher') {
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
        return res.json([]);
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conditions = [
      eq(classChildren.classId, classId),
      eq(presentations.status, 'to be presented'),
    ];

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

    const result = await db
      .select({
        id: presentations.id,
        child_id: presentations.childId,
        name: presentations.name,
        category: presentations.category,
        status: presentations.status,
        notes: presentations.notes,
        created_at: presentations.createdAt,
        child_firstname: children.firstname,
        child_surname: children.surname,
      })
      .from(presentations)
      .innerJoin(children, eq(presentations.childId, children.id))
      .innerJoin(classChildren, eq(children.id, classChildren.childId))
      .where(and(...conditions))
      .orderBy(asc(presentations.createdAt));
    res.json(result);
  } catch (err) {
    console.error('Error fetching next presentations:', err);
    res.status(500).json({ error: 'Failed to fetch next presentations' });
  }
});

export default router;
