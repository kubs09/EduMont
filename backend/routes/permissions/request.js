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
      `SELECT id FROM presentation_permissions
       WHERE class_id = $1 AND admin_id = $2 AND permission_requested = TRUE`,
      [resource_id, requester_id]
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

router.get('/granted', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { resource_id } = req.query;
    const user_id = req.user.id;
    const user_role = req.user.role;

    if (user_role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can check presentation permissions' });
    }

    if (!resource_id) {
      return res.status(400).json({ error: 'resource_id is required' });
    }

    const permissionCheck = await client.query(
      `SELECT granted FROM presentation_permissions
       WHERE class_id = $1 AND admin_id = $2`,
      [resource_id, user_id]
    );

    const hasAccess = permissionCheck.rows.length > 0 && permissionCheck.rows[0].granted === true;

    res.json({
      has_access: hasAccess,
    });
  } catch (error) {
    console.error('Permission granted check error:', error);
    res.status(500).json({
      error: 'Failed to check presentation permission',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});

router.get('/pending', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { class_id } = req.query;
    const user_id = req.user.id;
    const user_role = req.user.role;

    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    const teacherCheck = await client.query(
      'SELECT * FROM class_teachers WHERE class_id = $1 AND teacher_id = $2',
      [class_id, user_id]
    );

    if (teacherCheck.rows.length === 0 && user_role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this class' });
    }

    const pendingRequests = await client.query(
      `SELECT pp.*, u.firstname, u.surname, u.email 
       FROM presentation_permissions pp 
       JOIN users u ON pp.admin_id = u.id 
       WHERE pp.class_id = $1 AND pp.permission_requested = TRUE`,
      [class_id]
    );

    res.json({
      has_pending: pendingRequests.rows.length > 0,
      requests: pendingRequests.rows,
    });
  } catch (error) {
    console.error('Pending permission check error:', error);
    res.status(500).json({
      error: 'Failed to check pending permission requests',
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
      `SELECT id FROM presentation_permissions
       WHERE class_id = $1 AND admin_id = $2 AND permission_requested = TRUE`,
      [resource_id, requester_id]
    );

    const alreadyRequested = existingRequestCheck.rows.length > 0;

    const subjectEn = 'Permission Request';
    const subjectCs = 'Žádost o oprávnění';
    const subject = language === 'cs' ? subjectCs : subjectEn;

    if (alreadyRequested) {
      await client.query('ROLLBACK');
      return res.status(200).json({
        message: 'Permission request already sent',
        recipients_count: teachersResult.rows.length || 1,
        already_requested: true,
      });
    }

    const checkExisting = await client.query(
      'SELECT * FROM presentation_permissions WHERE class_id = $1 AND admin_id = $2',
      [resource_id, requester_id]
    );

    if (checkExisting.rows.length > 0) {
      await client.query(
        'UPDATE presentation_permissions SET permission_requested = TRUE, granted = FALSE, updated_at = CURRENT_TIMESTAMP WHERE class_id = $1 AND admin_id = $2',
        [resource_id, requester_id]
      );
    } else {
      await client.query(
        'INSERT INTO presentation_permissions (class_id, admin_id, permission_requested, granted) VALUES ($1, $2, TRUE, FALSE)',
        [resource_id, requester_id]
      );
    }

    let content = '';
    if (language === 'cs') {
      content = `Administrátor ${requesterName} (${requester.email}) požádal o oprávnění k prezentacím.\n\n`;
      content += `Třída: ${className}\n`;
      if (resource_type) {
        content += `Typ zdroje: ${resource_type}\n`;
      }
      if (reason) {
        content += `Důvod: ${reason}\n`;
      }
      content += `\nČas žádosti: ${new Date().toLocaleString('cs-CZ')}`;
    } else {
      content = `Administrator ${requesterName} (${requester.email}) has requested permission to access presentations.\n\n`;
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
