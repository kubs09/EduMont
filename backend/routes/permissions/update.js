/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

router.post('/accept', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { class_id, language } = req.body;
    const approver_id = req.user.id;

    const approverCheck = await client.query(
      'SELECT * FROM class_teachers WHERE class_id = $1 AND teacher_id = $2',
      [class_id, approver_id]
    );

    if (!approverCheck.rows.length) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'You do not have permission to approve requests for this class' });
    }

    const permissionCheck = await client.query(
      'SELECT pp.*, u.firstname, u.surname FROM presentation_permissions pp JOIN users u ON pp.admin_id = u.id WHERE pp.class_id = $1 AND pp.permission_requested = TRUE',
      [class_id]
    );

    if (!permissionCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No pending permission request found for this class' });
    }

    const requester_id = permissionCheck.rows[0].admin_id;

    const classResult = await client.query('SELECT name FROM classes WHERE id = $1', [class_id]);
    const className = classResult.rows[0]?.name || class_id;

    await client.query(
      'UPDATE presentation_permissions SET permission_requested = FALSE, granted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE class_id = $1 AND admin_id = $2',
      [class_id, requester_id]
    );

    const subjectEn = `Your permission request for class "${className}" has been accepted`;
    const subjectCs = `Vaše žádost o oprávnění pro třídu "${className}" byla přijata`;
    const subject = language === 'cs' ? subjectCs : subjectEn;

    let messageContent = '';
    if (language === 'cs') {
      messageContent = `Vaše žádost o oprávnění k prezentacím pro třídu "${className}" byla přijata. Nyní máte přístup k prezentacím.`;
    } else {
      messageContent = `Your permission request for presentations in class "${className}" has been accepted. You now have access to presentations.`;
    }

    await client.query(
      'INSERT INTO messages (from_user_id, to_user_id, subject, content) VALUES ($1, $2, $3, $4)',
      [approver_id, requester_id, subject, messageContent]
    );

    await client.query('COMMIT');
    res.json({ message: 'Permission request accepted successfully' });
  } catch (error) {
    console.error('Permission accept error:', error);
    await client.query('ROLLBACK');
    res.status(500).json({
      error: 'Failed to accept permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});

router.post('/deny', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { class_id, language } = req.body;
    const denier_id = req.user.id;

    const denierCheck = await client.query(
      'SELECT * FROM class_teachers WHERE class_id = $1 AND teacher_id = $2',
      [class_id, denier_id]
    );

    if (!denierCheck.rows.length) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'You do not have permission to deny requests for this class' });
    }

    const permissionCheck = await client.query(
      'SELECT pp.*, u.firstname, u.surname FROM presentation_permissions pp JOIN users u ON pp.admin_id = u.id WHERE pp.class_id = $1 AND pp.permission_requested = TRUE',
      [class_id]
    );

    if (!permissionCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No pending permission request found for this class' });
    }

    const requester_id = permissionCheck.rows[0].admin_id;

    const classResult = await client.query('SELECT name FROM classes WHERE id = $1', [class_id]);
    const className = classResult.rows[0]?.name || class_id;

    await client.query(
      'DELETE FROM presentation_permissions WHERE class_id = $1 AND admin_id = $2',
      [class_id, requester_id]
    );

    const subjectEn = `Your permission request for class "${className}" has been denied`;
    const subjectCs = `Vaše žádost o oprávnění pro třídu "${className}" byla zamítnuta`;
    const subject = language === 'cs' ? subjectCs : subjectEn;

    let messageContent = '';
    if (language === 'cs') {
      messageContent = `Vaše žádost o oprávnění k prezentacím pro třídu "${className}" byla zamítnuta.`;
    } else {
      messageContent = `Your permission request for presentations in class "${className}" has been denied.`;
    }

    await client.query(
      'INSERT INTO messages (from_user_id, to_user_id, subject, content) VALUES ($1, $2, $3, $4)',
      [denier_id, requester_id, subject, messageContent]
    );

    await client.query('COMMIT');
    res.json({ message: 'Permission request denied successfully' });
  } catch (error) {
    console.error('Permission deny error:', error);
    await client.query('ROLLBACK');
    res.status(500).json({
      error: 'Failed to deny permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
