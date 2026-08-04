import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq, exists } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '#backend/config/database.js';
import { childParents, users } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

const requesterChildParents = alias(childParents, 'requester_child_parents');
const targetChildParents = alias(childParents, 'target_child_parents');

router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.query;

    let query = db
      .select({
        id: users.id,
        firstname: users.firstname,
        surname: users.surname,
        email: users.email,
        role: users.role,
      })
      .from(users);

    if (role) {
      query = query.where(eq(users.role, role));
    }

    const result = await query.orderBy(users.surname);
    res.json(result);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const result = await db
      .select({
        id: users.id,
        firstname: users.firstname,
        surname: users.surname,
        email: users.email,
        role: users.role,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = result[0];
    const requesterRole = req.user.role;
    const isSelf = req.user.id === targetUser.id;
    const canViewProfile =
      requesterRole === 'admin' ||
      isSelf ||
      (requesterRole === 'parent' && targetUser.role === 'teacher') ||
      (requesterRole === 'teacher' && targetUser.role === 'parent') ||
      (requesterRole === 'teacher' && targetUser.role === 'teacher');

    if (!canViewProfile) {
      if (requesterRole === 'parent' && targetUser.role === 'parent') {
        const sharedChildResult = await db
          .select({ id: requesterChildParents.childId })
          .from(requesterChildParents)
          .where(
            and(
              eq(requesterChildParents.parentId, req.user.id),
              exists(
                db
                  .select({ id: targetChildParents.childId })
                  .from(targetChildParents)
                  .where(
                    and(
                      eq(targetChildParents.childId, requesterChildParents.childId),
                      eq(targetChildParents.parentId, targetUser.id)
                    )
                  )
              )
            )
          )
          .limit(1);

        if (sharedChildResult.length > 0) {
          return res.json(targetUser);
        }
      }

      return res.status(403).json({ error: 'Not authorized to view this profile' });
    }

    res.json(targetUser);
  } catch (error) {
    console.error('Fetch user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
