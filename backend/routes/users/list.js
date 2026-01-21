/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('@config/database');
const auth = require('@middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = 'SELECT id, firstname, surname, email, role FROM users';
    const params = [];
    
    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }
    
    query += ' ORDER BY surname ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
