/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const { transporter } = require('../config/mail');
const getMessageNotificationEmail = require('../templates/messageNotificationEmail');

async function getAllowedRecipients(userId, userRole, client) {
  switch (userRole) {
    case 'admin':
      return client.query(
        `WITH user_classes AS (
          SELECT DISTINCT
            u.id,
            u.firstname,
            u.surname,
            u.email,
            u.role,
            c.id as class_id,
            c.name as class_name
          FROM users u
          LEFT JOIN class_teachers ct ON u.id = ct.teacher_id
          LEFT JOIN classes c ON ct.class_id = c.id
          WHERE u.id != $1
          UNION
          SELECT DISTINCT
            u.id,
            u.firstname,
            u.surname,
            u.email,
            u.role,
            c.id as class_id,
            c.name as class_name
          FROM users u
          LEFT JOIN children ch ON u.id = ch.parent_id
          LEFT JOIN class_children cc ON ch.id = cc.child_id
          LEFT JOIN classes c ON cc.class_id = c.id
          WHERE u.id != $1
        )
        SELECT 
          id,
          firstname,
          surname,
          email,
          role,
          string_agg(DISTINCT class_name, ', ') as class_names,
          array_agg(DISTINCT class_id) FILTER (WHERE class_id IS NOT NULL) as class_ids
        FROM user_classes
        GROUP BY id, firstname, surname, email, role
        ORDER BY role, surname, firstname`,
        [userId]
      );

    case 'teacher':
      return client.query(
        `WITH teacher_classes AS (
          SELECT c.id as class_id, c.name as class_name
          FROM class_teachers ct
          JOIN classes c ON ct.class_id = c.id
          WHERE ct.teacher_id = $1
        ),
        allowed_users AS (
          -- Get admins
          SELECT u.*, NULL as class_id, NULL as class_name
          FROM users u
          WHERE u.role = 'admin' AND u.id != $1
          UNION ALL
          -- Get other teachers
          SELECT u.*, ct.class_id, c.name as class_name
          FROM users u
          JOIN class_teachers ct ON u.id = ct.teacher_id
          JOIN classes c ON ct.class_id = c.id
          WHERE u.role = 'teacher' AND u.id != $1
          UNION ALL
          -- Get parents of children in teacher's classes
          SELECT DISTINCT u.*, cc.class_id, c.name as class_name
          FROM users u
          JOIN children ch ON u.id = ch.parent_id
          JOIN class_children cc ON ch.id = cc.child_id
          JOIN classes c ON cc.class_id = c.id
          JOIN teacher_classes tc ON tc.class_id = cc.class_id
          WHERE u.role = 'parent'
        )
        SELECT 
          id,
          firstname,
          surname,
          email,
          role,
          string_agg(DISTINCT class_name, ', ') FILTER (WHERE class_name IS NOT NULL) as class_names,
          array_agg(DISTINCT class_id) FILTER (WHERE class_id IS NOT NULL) as class_ids
        FROM allowed_users
        GROUP BY id, firstname, surname, email, role
        ORDER BY role, surname, firstname`,
        [userId]
      );

    case 'parent':
      return client.query(
        `WITH parent_classes AS (
          SELECT DISTINCT c.id as class_id, c.name as class_name
          FROM children ch
          JOIN class_children cc ON ch.id = cc.child_id
          JOIN classes c ON cc.class_id = c.id
          WHERE ch.parent_id = $1
        )
        SELECT 
          u.id,
          u.firstname,
          u.surname,
          u.email,
          u.role,
          string_agg(DISTINCT c.name, ', ') as class_names,
          array_agg(DISTINCT ct.class_id) as class_ids
        FROM users u
        JOIN class_teachers ct ON u.id = ct.teacher_id
        JOIN classes c ON ct.class_id = c.id
        JOIN parent_classes pc ON pc.class_id = ct.class_id
        GROUP BY u.id, u.firstname, u.surname, u.email, u.role
        ORDER BY u.surname, u.firstname`,
        [userId]
      );

    default:
      throw new Error('Invalid user role');
  }
}

// Replace the /users route with this updated version
router.get('/users', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await getAllowedRecipients(req.user.id, req.user.role, client);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  } finally {
    client.release();
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      WITH recipients AS (
        SELECT 
          m2.subject,
          m2.content,
          m2.created_at,
          m2.from_user_id,
          json_agg(json_build_object(
            'id', u.id,
            'firstname', u.firstname,
            'surname', u.surname,
            'email', u.email
          ) ORDER BY u.surname, u.firstname) as recipients
        FROM messages m2
        JOIN users u ON m2.to_user_id = u.id
        GROUP BY m2.subject, m2.content, m2.created_at, m2.from_user_id
      )
      SELECT DISTINCT ON (m.subject, m.content, m.created_at) m.*, 
        json_build_object(
          'firstname', f.firstname,
          'surname', f.surname,
          'email', f.email
        ) as from_user,
        json_build_object(
          'firstname', t.firstname,
          'surname', t.surname,
          'email', t.email
        ) as to_user,
        r.recipients
      FROM messages m
      JOIN users f ON m.from_user_id = f.id
      JOIN users t ON m.to_user_id = t.id
      LEFT JOIN recipients r ON 
        r.subject = m.subject 
        AND r.content = m.content 
        AND r.created_at = m.created_at
        AND r.from_user_id = m.from_user_id
      WHERE m.to_user_id = $1 AND NOT m.deleted_by_recipient
      OR m.from_user_id = $1 AND NOT m.deleted_by_sender
      ORDER BY m.subject, m.content, m.created_at DESC, m.id DESC
    `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      WITH recipients AS (
        SELECT 
          m2.subject,
          m2.content,
          m2.created_at,
          m2.from_user_id,
          json_agg(json_build_object(
            'id', u.id,
            'firstname', u.firstname,
            'surname', u.surname,
            'email', u.email
          ) ORDER BY u.surname, u.firstname) as recipients
        FROM messages m2
        JOIN users u ON m2.to_user_id = u.id
        WHERE m2.subject = (SELECT subject FROM messages WHERE id = $1)
          AND m2.content = (SELECT content FROM messages WHERE id = $1)
          AND m2.created_at = (SELECT created_at FROM messages WHERE id = $1)
          AND m2.from_user_id = (SELECT from_user_id FROM messages WHERE id = $1)
        GROUP BY m2.subject, m2.content, m2.created_at, m2.from_user_id
      )
      SELECT m.*, 
        json_build_object(
          'firstname', f.firstname,
          'surname', f.surname,
          'email', f.email
        ) as from_user,
        json_build_object(
          'firstname', t.firstname,
          'surname', t.surname,
          'email', t.email
        ) as to_user,
        r.recipients
      FROM messages m
      JOIN users f ON m.from_user_id = f.id
      JOIN users t ON m.to_user_id = t.id
      LEFT JOIN recipients r ON 
        r.subject = m.subject 
        AND r.content = m.content 
        AND r.created_at = m.created_at
        AND r.from_user_id = m.from_user_id
      WHERE m.id = $1 AND (m.to_user_id = $2 OR m.from_user_id = $2)
    `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (result.rows[0].to_user_id === req.user.id && !result.rows[0].read_at) {
      await pool.query('UPDATE messages SET read_at = NOW() WHERE id = $1', [req.params.id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Update the POST route to validate recipients
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { to_user_ids, subject, content, language } = req.body;
    const from_user_id = req.user.id;

    // Validate recipients
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

    // Create single message and get its ID
    const messageResult = await client.query(
      'INSERT INTO messages (from_user_id, to_user_id, subject, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [from_user_id, to_user_ids[0], subject, content]
    );

    const messageId = messageResult.rows[0].id;

    // Create additional messages for other recipients
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

    // Get recipient info and send notifications with sender's language
    const recipientsResult = await client.query(
      'SELECT id, email, message_notifications FROM users WHERE id = ANY($1)',
      [to_user_ids]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Only send emails to users who have notifications enabled
    for (const recipient of recipientsResult.rows) {
      if (recipient.message_notifications) {
        try {
          const emailContent = getMessageNotificationEmail(
            senderName,
            messageId,
            frontendUrl,
            language // Use language from request
          );

          await transporter.sendMail({
            from: process.env.SMTP_FROM || `EduMont <${process.env.SMTP_USER}>`,
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

router.delete('/:id', auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const message = await client.query(
      'SELECT * FROM messages WHERE id = $1 AND (from_user_id = $2 OR to_user_id = $2)',
      [req.params.id, req.user.id]
    );

    if (message.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Message not found' });
    }

    const column =
      message.rows[0].from_user_id === req.user.id ? 'deleted_by_sender' : 'deleted_by_recipient';
    await client.query(`UPDATE messages SET ${column} = true WHERE id = $1`, [req.params.id]);

    await client.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete message' });
  } finally {
    client.release();
  }
});

module.exports = router;
