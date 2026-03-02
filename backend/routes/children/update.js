import { Router } from 'express';
const router = Router();
import pool from '#backend/config/database.js';
import authenticateToken from '#backend/middleware/auth.js';
import validation from './validation.js';
import console from 'console';
const { validateChildUpdate, validateParentIds } = validation;

const toDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return value;
};

router.put('/:id', authenticateToken, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { id } = req.params;
    const { firstname, surname, date_of_birth, parent_ids, notes, class_id } = req.body;

    const childId = Number(id);
    if (!Number.isInteger(childId) || childId <= 0) {
      return res.status(400).json({ error: 'Invalid child identifier' });
    }

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
        [childId, req.user.id]
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
      [firstname, surname, actualDateOfBirth, notes, childId]
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

      await client.query('DELETE FROM child_parents WHERE child_id = $1', [childId]);
      await client.query(
        `INSERT INTO child_parents (child_id, parent_id)
         SELECT $1, unnest($2::int[])`,
        [childId, parent_ids]
      );
    }

    const normalizedClassId =
      class_id === null || class_id === undefined || class_id === '' ? null : Number(class_id);

    if (
      normalizedClassId !== null &&
      (!Number.isInteger(normalizedClassId) || normalizedClassId <= 0)
    ) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid class identifier' });
    }

    if (normalizedClassId !== null) {
      const childAge = Math.floor(
        (new Date() - new Date(actualDateOfBirth || result.rows[0].date_of_birth)) /
          (365.25 * 24 * 60 * 60 * 1000)
      );

      const classResult = await client.query(
        'SELECT id FROM classes WHERE id = $1 AND $2 BETWEEN min_age AND max_age',
        [normalizedClassId, childAge]
      );

      if (classResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'selectedClassNotSuitable',
          details: "The selected class is not suitable for the child's age",
        });
      }
    }

    await client.query(
      `WITH upserted AS (
      INSERT INTO class_children (child_id, class_id)
      VALUES ($1, $2)
      ON CONFLICT (child_id) DO UPDATE 
      SET class_id = EXCLUDED.class_id
      WHERE class_children.class_id IS DISTINCT FROM EXCLUDED.class_id
      RETURNING child_id, class_id
    )
      UPDATE presentations p
      SET class_id = u.class_id,
          updated_at = CURRENT_TIMESTAMP
      FROM upserted u
      WHERE p.child_id = u.child_id`,
      [childId, normalizedClassId]
    );

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
      [childId]
    );

    await client.query('COMMIT');
    res.json(updatedChild.rows[0]);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error updating child:', err);
    res.status(500).json({ error: 'Failed to update child record' });
  } finally {
    client?.release();
  }
});

export default router;
