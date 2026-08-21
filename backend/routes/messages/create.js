import { Router } from 'express';
const router = Router();
import { eq, inArray } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { messages, users } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';
import mailConfig from '#backend/config/mail.js';
import process from 'process';
const { sendEmail } = mailConfig;
import getMessageNotificationEmail from '#backend/templates/messageNotificationEmail.js';
import { getAllowedRecipients } from './helpers.js';

router.post('/', auth, async (req, res) => {
  try {
    const { to_user_ids, subject, content, language } = req.body;
    const from_user_id = req.user.id;

    const insertedFirstMessage = await db.transaction(async (tx) => {
      const allowedRecipientsResult = await getAllowedRecipients(from_user_id, req.user.role, tx);
      const allowedIds = new Set(allowedRecipientsResult.rows.map((r) => r.id));

      const invalidRecipients = to_user_ids.filter((id) => !allowedIds.has(id));
      if (invalidRecipients.length > 0) {
        throw new Error('invalidRecipients');
      }

      const senderResult = await tx
        .select({ firstname: users.firstname, surname: users.surname })
        .from(users)
        .where(eq(users.id, from_user_id));

      const senderName = `${senderResult[0].firstname} ${senderResult[0].surname}`;

      const insertedMessages = await tx
        .insert(messages)
        .values(
          to_user_ids.map((recipientId) => ({
            fromUserId: from_user_id,
            toUserId: recipientId,
            subject,
            content,
          }))
        )
        .returning({
          id: messages.id,
          to_user_id: messages.toUserId,
          from_user_id: messages.fromUserId,
          subject: messages.subject,
          content: messages.content,
        });

      const messageIdByRecipient = new Map(insertedMessages.map((row) => [row.to_user_id, row.id]));

      const recipientsResult = await tx
        .select({
          id: users.id,
          email: users.email,
          messageNotifications: users.messageNotifications,
        })
        .from(users)
        .where(inArray(users.id, to_user_ids));

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      for (const recipient of recipientsResult) {
        if (recipient.messageNotifications) {
          const emailContent = getMessageNotificationEmail(
            senderName,
            messageIdByRecipient.get(recipient.id),
            frontendUrl,
            language
          );

          await sendEmail({
            to: recipient.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      }

      return insertedMessages[0];
    });

    res.status(201).json(insertedFirstMessage);
  } catch (error) {
    if (error.message === 'invalidRecipients') {
      return res.status(403).json({ error: 'Some recipients are not allowed' });
    }
    res.status(500).json({
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
