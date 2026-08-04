import { Router } from 'express';
const router = Router();
import { eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { classChildren, classTeachers, classes } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete classes' });
  }

  try {
    const classId = Number(req.params.id);

    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({ error: 'Invalid class identifier' });
    }

    await db.transaction(async (tx) => {
      await tx.delete(classTeachers).where(eq(classTeachers.classId, classId));
      await tx.delete(classChildren).where(eq(classChildren.classId, classId));
      await tx.delete(classes).where(eq(classes.id, classId));
    });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

export default router;
