import { Router } from 'express';
const router = Router();
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { childParents, classChildren, classHistory, children, users } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.get('/:id/history', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Unauthorized to view class history' });
  }

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
            sql`EXISTS (SELECT 1 FROM ${childParents} cp WHERE cp.child_id = ${children.id} AND cp.parent_id = ${req.user.id})`
          )
        );
      if (parentChildCheck.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await db
      .select({
        id: classHistory.id,
        class_id: classHistory.classId,
        date: classHistory.date,
        notes: classHistory.notes,
        created_at: classHistory.createdAt,
        created_by: sql`json_build_object('id', ${users.id}, 'firstname', ${users.firstname}, 'surname', ${users.surname})`,
      })
      .from(classHistory)
      .leftJoin(users, eq(classHistory.createdBy, users.id))
      .where(eq(classHistory.classId, classId))
      .orderBy(desc(classHistory.date));

    res.json(result);
  } catch (error) {
    console.error('Fetch class history error:', error);
    res.status(500).json({ error: 'Failed to fetch class history' });
  }
});

router.post('/:id/history', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only teachers and administrators can add history entries' });
  }

  try {
    const { date, notes } = req.body;
    const result = await db
      .insert(classHistory)
      .values({
        classId: Number(req.params.id),
        date,
        notes,
        createdBy: req.user.id,
      })
      .returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create class history entry error:', error);
    res.status(500).json({ error: 'Failed to create history entry' });
  }
});

router.delete('/:classId/history/:historyId', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res
      .status(403)
      .json({ error: 'Only teachers and administrators can delete history entries' });
  }

  try {
    await db
      .delete(classHistory)
      .where(
        and(
          eq(classHistory.id, Number(req.params.historyId)),
          eq(classHistory.classId, Number(req.params.classId))
        )
      );
    res.json({ message: 'History entry deleted successfully' });
  } catch (error) {
    console.error('Delete class history entry error:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
});

export default router;
