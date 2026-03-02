import { Router } from 'express';
const router = Router();
import console from 'console';
import process from 'process';
import { connect } from '../../config/database.js';
import auth from '../../middleware/auth.js';

router.get('/check', auth, async (req, res) => {
  let client;
  try {
    client = await connect();
    const resource_id = Number(req.query.resource_id);
    const requester_id = req.user.id;
    const requester_role = req.user.role;

    if (!Number.isInteger(resource_id) || resource_id <= 0) {
      return res.status(400).json({ error: 'resource_id must be a positive integer' });
    }

    if (requester_role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can check permission requests' });
    }

    const classResult = await client.query('SELECT id, name FROM classes WHERE id = $1', [
      resource_id,
    ]);

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

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
    client?.release();
  }
});

router.get('/granted', auth, async (req, res) => {
  const client = await connect();
  try {
    const resource_id = Number(req.query.resource_id);
    const user_id = req.user.id;
    const user_role = req.user.role;

    if (!Number.isInteger(resource_id) || resource_id <= 0) {
      return res.status(400).json({ error: 'resource_id must be a positive integer' });
    }

    if (user_role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can check presentation permissions' });
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
  const client = await connect();
  try {
    const class_id = Number(req.query.class_id);
    const user_id = req.user.id;
    const user_role = req.user.role;

    if (!Number.isInteger(class_id) || class_id <= 0) {
      return res.status(400).json({ error: 'class_id must be a positive integer' });
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
       WHERE pp.class_id = $1 AND pp.permission_requested = TRUE AND pp.granted = FALSE`,
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
  const client = await connect();
  try {
    const { resource_type, reason, language } = req.body;
    const resource_id = Number(req.body.resource_id);
    const requester_id = req.user.id;
    const requester_role = req.user.role;

    if (!Number.isInteger(resource_id) || resource_id <= 0) {
      return res.status(400).json({ error: 'resource_id must be a positive integer' });
    }

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

    await client.query('BEGIN');

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

    const upsertResult = await client.query(
      `INSERT INTO presentation_permissions (class_id, admin_id, permission_requested, granted)
       VALUES ($1, $2, TRUE, FALSE)
       ON CONFLICT (admin_id, class_id)
       DO UPDATE SET
         permission_requested = TRUE,
         granted = FALSE,
         updated_at = CURRENT_TIMESTAMP
         WHERE presentation_permissions.permission_requested IS DISTINCT FROM TRUE
         RETURNING id`,
      [resource_id, requester_id]
    );

    if (upsertResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({
        message: 'Permission request already exists and is pending',
        already_requested: true,
      });
    }

    const subjectEn = 'Permission Request';
    const subjectCs = 'Žádost o oprávnění';
    const subject = language === 'cs' ? subjectCs : subjectEn;

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
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback error after permission request failure:', rollbackError);
    }
    console.error('Permission request error:', error);
    res.status(500).json({
      error: 'Failed to send permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});

export default router;
