import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { childParents, children, classTeachers, messages, users } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.delete('/:id', auth, async (req, res) => {
  const userId = Number(req.params.id);

  try {
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const userCheck = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userCheck[0].role;

    await db.transaction(async (tx) => {
      await tx.delete(classTeachers).where(eq(classTeachers.teacherId, userId));

      if (userRole === 'parent') {
        const childLinks = await tx
          .select({ childId: childParents.childId })
          .from(childParents)
          .where(eq(childParents.parentId, userId));

        const childIds = childLinks.map((row) => row.childId);

        await tx.delete(childParents).where(eq(childParents.parentId, userId));

        if (childIds.length > 0) {
          const orphanedChildren = await tx
            .select({ id: children.id })
            .from(children)
            .leftJoin(childParents, eq(children.id, childParents.childId))
            .where(and(inArray(children.id, childIds), isNull(childParents.childId)));

          const orphanedIds = orphanedChildren.map((row) => row.id);
          if (orphanedIds.length > 0) {
            await tx.delete(children).where(inArray(children.id, orphanedIds));
          }
        }
      }

      await tx
        .delete(messages)
        .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)));

      await tx.delete(users).where(eq(users.id, userId));
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
