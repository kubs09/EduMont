import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq, or } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { messages } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.delete('/:id', auth, async (req, res) => {
  try {
    const messageId = req.params.id;

    const result = await db.transaction(async (tx) => {
      const message = await tx
        .select({ fromUserId: messages.fromUserId })
        .from(messages)
        .where(
          and(
            eq(messages.id, messageId),
            or(eq(messages.fromUserId, req.user.id), eq(messages.toUserId, req.user.id))
          )
        );

      if (message.length === 0) {
        return { found: false };
      }

      const set =
        message[0].fromUserId === req.user.id
          ? { deletedBySender: true }
          : { deletedByRecipient: true };

      await tx.update(messages).set(set).where(eq(messages.id, messageId));

      return { found: true };
    });

    if (!result.found) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
