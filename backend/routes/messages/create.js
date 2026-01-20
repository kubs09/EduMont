/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');
const { sendEmail } = require('../../config/mail');
const getMessageNotificationEmail = require('../../templates/messageNotificationEmail');
const { getAllowedRecipients } = require('./helpers');

router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
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

    const messageResult = await client.query(
      'INSERT INTO messages (from_user_id, to_user_id, subject, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [from_user_id, to_user_ids[0], subject, content]
    );

    const messageId = messageResult.rows[0].id;

    if (to_user_ids.length > 1) {
      const additionalValues = to_user_ids
        .slice(1)
        .map((id) => `(${from_user_id}, ${id}, $1, $2)`)
        .join(', ');

      if (additionalValues) {
        await client.query(
          `
          INSERT INTO messages (from_user_id, to_user_id, subject, content)
          VALUES ${additionalValues}
        `,
          [subject, content]
        );
      }
    }

    const recipientsResult = await client.query(
      'SELECT id, email, message_notifications FROM users WHERE id = ANY($1)',
      [to_user_ids]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const recipient of recipientsResult.rows) {
      if (recipient.message_notifications) {
        try {
          const emailContent = getMessageNotificationEmail(
            senderName,
            messageId,
            frontendUrl,
            language
          );

          await sendEmail({
            to: recipient.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        } catch (emailError) {
          throw emailError;
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(messageResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
