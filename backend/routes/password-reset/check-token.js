/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');

router.get('/check-token/:token', async (req, res) => {
  let { token } = req.params;
  const client = await pool.connect();

  try {
    token = decodeURIComponent(token);
    if (token.includes('=')) {
      token = token.split('=').pop();
    }

    const result = await client.query(
      'SELECT id, reset_token, reset_token_expiry FROM users WHERE reset_token = $1',
      [token]
    );

    res.json({
      valid: result.rows.length > 0,
      expired: result.rows[0]?.reset_token_expiry < new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check token' });
  } finally {
    client.release();
  }
});

module.exports = router;
