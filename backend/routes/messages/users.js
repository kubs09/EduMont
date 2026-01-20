/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');
const { getAllowedRecipients } = require('./helpers');

// Get allowed recipients for the authenticated user
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

module.exports = router;
