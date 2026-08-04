import { Router } from 'express';
const router = Router();
import console from 'console';
import process from 'process';
import { and, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { childParents, children, classChildren } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const childId = Number(req.params.id);

    if (!Number.isInteger(childId) || childId <= 0) {
      return res.status(400).json({ error: 'Invalid child identifier' });
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
        return res.status(403).json({ error: 'Unauthorized to delete this child' });
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(classChildren).where(eq(classChildren.childId, childId));
      await tx.delete(children).where(eq(children.id, childId));
    });

    res.json({ message: 'Child deleted successfully' });
  } catch (err) {
    console.error('Error deleting child:', err);
    res.status(500).json({ error: 'Failed to delete child record' });
  }
});

router.delete('/:childId/classes/:classId', authenticateToken, async (req, res) => {
  try {
    const childId = Number(req.params.childId);
    const classId = Number(req.params.classId);

    if (!Number.isInteger(childId) || childId <= 0 || !Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({ error: 'Invalid identifier' });
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
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    await db
      .delete(classChildren)
      .where(and(eq(classChildren.childId, childId), eq(classChildren.classId, classId)));

    res.json({ message: 'Child removed from class successfully' });
  } catch (err) {
    console.error('Error removing child from class:', err);
    res.status(500).json({
      error: 'Failed to remove child from class',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

export default router;
