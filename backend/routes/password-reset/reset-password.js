/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const client = await pool.connect();

  try {
    if (!token || token.length !== 64) {
      return res.status(400).json({ error: 'Invalid reset token format' });
    }

    await client.query('BEGIN');

    const checkResult = await client.query(
      'SELECT id, reset_token, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = checkResult.rows[0].id;
    const tokenExpiry = checkResult.rows[0].reset_token_expiry;

    if (tokenExpiry < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updateResult = await client.query(
      `UPDATE users 
       SET password = $1, 
           reset_token = NULL, 
           reset_token_expiry = NULL 
       WHERE id = $2 AND reset_token = $3
       RETURNING id`,
      [hashedPassword, userId, token]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Failed to update password' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to reset password' });
  } finally {
    client.release();
  }
});

module.exports = router;
