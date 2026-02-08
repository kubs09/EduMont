/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { validateChildUpdate, validateParentIds } = require('./validation');

const toDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return value;
};

router.put('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { firstname, surname, date_of_birth, parent_ids, notes } = req.body;

    const validationErrors = validateChildUpdate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    if (parent_ids && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can edit parents' });
    }

    if (parent_ids) {
      const parentIdErrors = validateParentIds(parent_ids, true);
      if (parentIdErrors.length > 0) {
        return res.status(400).json({ errors: parentIdErrors });
      }
    }

    const child = await client.query('SELECT id FROM children WHERE id = $1', [id]);
    if (child.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (req.user.role === 'parent') {
      const parentLink = await client.query(
        'SELECT 1 FROM child_parents WHERE child_id = $1 AND parent_id = $2',
        [id, req.user.id]
      );
      if (parentLink.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to edit this child' });
      }
    }

    const actualDateOfBirth = toDateString(date_of_birth);

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE children 
       SET firstname = $1, surname = $2, date_of_birth = COALESCE($3::date, date_of_birth), notes = $4
       WHERE id = $5
       RETURNING *`,
      [firstname, surname, actualDateOfBirth, notes, id]
    );

    if (parent_ids) {
      const validParents = await client.query(
        'SELECT id FROM users WHERE role = $1 AND id = ANY($2)',
        ['parent', parent_ids]
      );
      if (validParents.rows.length !== parent_ids.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ errors: ['One or more parent IDs are invalid'] });
      }

      await client.query('DELETE FROM child_parents WHERE child_id = $1', [id]);
      await client.query(
        `INSERT INTO child_parents (child_id, parent_id)
         SELECT $1, unnest($2::int[])`,
        [id, parent_ids]
      );
    }

    const updatedChild = await client.query(
      `SELECT 
        c.id,
        c.firstname,
        c.surname,
        c.date_of_birth,
        c.notes,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', u.id,
              'firstname', u.firstname,
              'surname', u.surname,
              'email', u.email,
              'phone', u.phone
            )
            ORDER BY u.surname, u.firstname
          )
          FROM child_parents cp
          JOIN users u ON cp.parent_id = u.id
          WHERE cp.child_id = c.id),
          '[]'
        ) as parents,
        cl.id as class_id,
        cl.name as class_name
      FROM children c
      LEFT JOIN class_children cc ON c.id = cc.child_id
      LEFT JOIN classes cl ON cc.class_id = cl.id
      WHERE c.id = $1`,
      [id]
    );

    await client.query('COMMIT');
    res.json(updatedChild.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update child record' });
  } finally {
    client.release();
  }
});

module.exports = router;
