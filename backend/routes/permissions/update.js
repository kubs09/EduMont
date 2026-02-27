/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

router.post('/accept', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { class_id } = req.body;
    const teacher_id = req.user.id;

    // Verify that the teacher has a pending permission request for this class
    const permissionCheck = await client.query(
      'SELECT * FROM class_teachers WHERE class_id = $1 AND teacher_id = $2 AND permission_requested = TRUE',
      [class_id, teacher_id]
    );

    if (!permissionCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Permission request not found or already processed' });
    }

    // Accept the permission by setting permission_requested to false
    await client.query(
      'UPDATE class_teachers SET permission_requested = FALSE WHERE class_id = $1 AND teacher_id = $2',
      [class_id, teacher_id]
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
    const { class_id } = req.body;
    const teacher_id = req.user.id;

    // Verify that the teacher has a pending permission request for this class
    const permissionCheck = await client.query(
      'SELECT * FROM class_teachers WHERE class_id = $1 AND teacher_id = $2 AND permission_requested = TRUE',
      [class_id, teacher_id]
    );

    if (!permissionCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Permission request not found or already processed' });
    }

    // Deny the permission by removing the teacher from the class
    await client.query('DELETE FROM class_teachers WHERE class_id = $1 AND teacher_id = $2', [
      class_id,
      teacher_id,
    ]);

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
