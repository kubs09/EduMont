/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

router.get('/check', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { resource_id } = req.query;
    const requester_id = req.user.id;
    const requester_role = req.user.role;

    if (requester_role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can check permission requests' });
    }

    if (!resource_id) {
      return res.status(400).json({ error: 'resource_id is required' });
    }

    const classResult = await client.query('SELECT id, name FROM classes WHERE id = $1', [
      resource_id,
    ]);

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const className = classResult.rows[0].name;

    const existingRequestCheck = await client.query(
      `SELECT m.id FROM messages m
       WHERE m.from_user_id = $1
       AND (m.subject = 'Permission Request' OR m.subject = 'Žádost o oprávnění')
       AND m.content LIKE $2
       AND m.created_at > NOW() - INTERVAL '7 days'`,
      [requester_id, `%${className}%`]
    );

    res.json({
      already_requested: existingRequestCheck.rows.length > 0,
    });
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({
      error: 'Failed to check permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});

router.post('/request', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { resource_type, resource_id, reason, language } = req.body;
    const requester_id = req.user.id;
    const requester_role = req.user.role;

    if (requester_role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can request permissions' });
    }

    const requesterResult = await client.query(
      'SELECT firstname, surname, email FROM users WHERE id = $1',
      [requester_id]
    );

    if (requesterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Requester not found' });
    }

    const requester = requesterResult.rows[0];
    const requesterName = `${requester.firstname} ${requester.surname}`;

    if (!resource_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Class ID (resource_id) is required' });
    }

    const classResult = await client.query('SELECT id, name FROM classes WHERE id = $1', [
      resource_id,
    ]);

    if (classResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Class not found' });
    }

    const className = classResult.rows[0].name;

    const teachersResult = await client.query(
      `SELECT u.id, u.firstname, u.surname, u.email, ct.role as class_role
       FROM class_teachers ct
       JOIN users u ON ct.teacher_id = u.id
       WHERE ct.class_id = $1`,
      [resource_id]
    );

    const existingRequestCheck = await client.query(
      `SELECT m.id FROM messages m
       WHERE m.from_user_id = $1
       AND (m.subject = 'Permission Request' OR m.subject = 'Žádost o oprávnění')
       AND m.content LIKE $2
       AND m.created_at > NOW() - INTERVAL '7 days'`,
      [requester_id, `%${className}%`]
    );

    const alreadyRequested = existingRequestCheck.rows.length > 0;

    const subjectEn = 'Permission Request';
    const subjectCs = 'Žádost o oprávnění';
    const subject = language === 'cs' ? subjectCs : subjectEn;

    if (alreadyRequested) {
      await client.query('COMMIT');
      return res.status(200).json({
        message: 'Permission request already sent',
        recipients_count: teachersResult.rows.length || 1,
        already_requested: true,
      });
    }

    let content = '';
    if (language === 'cs') {
      content = `Administrátor ${requesterName} (${requester.email}) požádal o oprávnění k přístupu.\n\n`;
      content += `Třída: ${className}\n`;
      if (resource_type) {
        content += `Typ zdroje: ${resource_type}\n`;
      }
      if (reason) {
        content += `Důvod: ${reason}\n`;
      }
      content += `\nČas žádosti: ${new Date().toLocaleString('cs-CZ')}`;
    } else {
      content = `Administrator ${requesterName} (${requester.email}) has requested access permission.\n\n`;
      content += `Class: ${className}\n`;
      if (resource_type) {
        content += `Resource Type: ${resource_type}\n`;
      }
      if (reason) {
        content += `Reason: ${reason}\n`;
      }
      content += `\nRequest Time: ${new Date().toLocaleString('en-US')}`;
    }

    if (teachersResult.rows.length > 0) {
      for (const teacher of teachersResult.rows) {
        await client.query(
          'INSERT INTO messages (from_user_id, to_user_id, subject, content) VALUES ($1, $2, $3, $4)',
          [requester_id, teacher.id, subject, content]
        );
      }
    } else {
      await client.query(
        'INSERT INTO messages (from_user_id, to_user_id, subject, content) VALUES ($1, $2, $3, $4)',
        [requester_id, requester_id, `[SYSTEM LOG] ${subject}`, content]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Permission request sent successfully',
      recipients_count: teachersResult.rows.length || 1,
      already_requested: false,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Permission request error:', error);
    res.status(500).json({
      error: 'Failed to send permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
