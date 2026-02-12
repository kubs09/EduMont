/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const validateExcuse = (data) => {
  const errors = [];

  if (!data.date_from || !dateRegex.test(data.date_from)) {
    errors.push('date_from is required and must be YYYY-MM-DD');
  }

  if (!data.date_to || !dateRegex.test(data.date_to)) {
    errors.push('date_to is required and must be YYYY-MM-DD');
  }

  if (
    data.date_from &&
    data.date_to &&
    dateRegex.test(data.date_from) &&
    dateRegex.test(data.date_to)
  ) {
    const fromDate = new Date(data.date_from);
    const toDate = new Date(data.date_to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      errors.push('date_from and date_to must be valid dates');
    } else if (toDate < fromDate) {
      errors.push('date_to must be on or after date_from');
    }
  }

  if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length === 0) {
    errors.push('reason is required');
  }

  if (data.reason && data.reason.length > 1000) {
    errors.push('reason must not exceed 1000 characters');
  }

  return errors;
};

const canAccessChild = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'parent') {
    const result = await pool.query(
      'SELECT 1 FROM child_parents WHERE child_id = $1 AND parent_id = $2',
      [childId, userId]
    );
    return result.rows.length > 0;
  }

  if (userRole === 'teacher') {
    const result = await pool.query(
      `
      SELECT 1 FROM class_teachers ct
      JOIN class_children cc ON ct.class_id = cc.class_id
      WHERE ct.teacher_id = $1 AND cc.child_id = $2
    `,
      [userId, childId]
    );
    return result.rows.length > 0;
  }

  return false;
};

router.get('/:id/excuses', auth, async (req, res) => {
  try {
    const childId = Number(req.params.id);

    if (!Number.isInteger(childId)) {
      return res.status(400).json({ error: 'Invalid child id' });
    }

    const canAccess = await canAccessChild(req.user.id, req.user.role, childId);
    if (!canAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `
      SELECT 
        ce.id,
        ce.child_id,
        ce.parent_id,
        ce.date_from,
        ce.date_to,
        ce.reason,
        ce.created_at,
        u.firstname as parent_firstname,
        u.surname as parent_surname
      FROM child_excuses ce
      LEFT JOIN users u ON ce.parent_id = u.id
      WHERE ce.child_id = $1
      ORDER BY ce.date_from DESC, ce.created_at DESC
    `,
      [childId]
    );

    res.json(result.rows || []);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch excuses',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/:id/excuses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create excuses' });
    }

    const childId = Number(req.params.id);

    if (!Number.isInteger(childId)) {
      return res.status(400).json({ error: 'Invalid child id' });
    }

    const validationErrors = validateExcuse(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const relation = await pool.query(
      'SELECT 1 FROM child_parents WHERE child_id = $1 AND parent_id = $2',
      [childId, req.user.id]
    );

    if (relation.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { date_from, date_to, reason } = req.body;

    const result = await pool.query(
      `
      INSERT INTO child_excuses (child_id, parent_id, date_from, date_to, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [childId, req.user.id, date_from, date_to, reason.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create excuse',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/:id/excuses/:excuseId', auth, async (req, res) => {
  try {
    const childId = Number(req.params.id);
    const excuseId = Number(req.params.excuseId);

    if (!Number.isInteger(childId) || !Number.isInteger(excuseId)) {
      return res.status(400).json({ error: 'Invalid child or excuse id' });
    }

    if (req.user.role !== 'parent' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const excuseResult = await pool.query(
      'SELECT id, child_id, parent_id FROM child_excuses WHERE id = $1',
      [excuseId]
    );

    if (excuseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Excuse not found' });
    }

    const excuse = excuseResult.rows[0];
    if (excuse.child_id !== childId) {
      return res.status(400).json({ error: 'Excuse does not belong to this child' });
    }

    if (req.user.role === 'parent') {
      const relation = await pool.query(
        'SELECT 1 FROM child_parents WHERE child_id = $1 AND parent_id = $2',
        [childId, req.user.id]
      );

      if (relation.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (excuse.parent_id !== req.user.id) {
        return res.status(403).json({ error: "Cannot cancel another parent's excuse" });
      }
    }

    await pool.query('DELETE FROM child_excuses WHERE id = $1', [excuseId]);

    res.json({ message: 'Excuse cancelled' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel excuse',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
