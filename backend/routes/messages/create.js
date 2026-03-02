import { Router } from 'express';
const router = Router();
import pool from '#backend/config/database.js';
import auth from '#backend/middleware/auth.js';
import mailConfig from '#backend/config/mail.js';
import process from 'process';
const { sendEmail } = mailConfig;
import getMessageNotificationEmail from '#backend/templates/messageNotificationEmail.js';
import { getAllowedRecipients } from './helpers.js';

router.post('/', auth, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const { to_user_ids, subject, content, language } = req.body;
    const from_user_id = req.user.id;

    const allowedRecipientsResult = await getAllowedRecipients(from_user_id, req.user.role, client);
    const allowedIds = new Set(allowedRecipientsResult.rows.map((r) => r.id));

    const invalidRecipients = to_user_ids.filter((id) => !allowedIds.has(id));
    if (invalidRecipients.length > 0) {
      throw new Error('Some recipients are not allowed');
    }

    const senderResult = await client.query('SELECT firstname, surname FROM users WHERE id = $1', [
      from_user_id,
    ]);

    const senderName = `${senderResult.rows[0].firstname} ${senderResult.rows[0].surname}`;

    const insertedMessage = await client.query(
      `
      INSERT INTO messages (from_user_id, to_user_id, subject, content)
      SELECT $1, recipient_id, $3, $4
      FROM unnest($2::int[]) AS recipient_id
      RETURNING id, to_user_id, from_user_id, subject, content
    `,
      [from_user_id, to_user_ids, subject, content]
    );

    const messageIdByRecipient = new Map(
      insertedMessage.rows.map((row) => [row.to_user_id, row.id])
    );

    const recipientsResult = await client.query(
      'SELECT id, email, message_notifications FROM users WHERE id = ANY($1)',
      [to_user_ids]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const recipient of recipientsResult.rows) {
      if (recipient.message_notifications) {
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

    await client.query('COMMIT');
    res.status(201).json(insertedMessage.rows[0]);
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    res.status(500).json({
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client?.release();
  }
});

export default router;
