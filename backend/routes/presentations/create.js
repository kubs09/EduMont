import { Router } from 'express';
const router = Router();
import pool from '#backend/config/database.js';
import console from 'console';
import authenticateToken from '#backend/middleware/auth.js';
import validationModule from './validation.js';
const { validatepresentation, canEditChildpresentation, normalizeCategoryOrdering } =
  validationModule;

// Create a new presentation entry
router.post('/', authenticateToken, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { child_id, class_id, name, category, status, notes, display_order } = req.body;

    const validationErrors = validatepresentation(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, child_id);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's presentation" });
    }

    await client.query('BEGIN');

    const classChildResult = await client.query(
      'SELECT 1 FROM class_children WHERE child_id = $1 AND class_id = $2',
      [child_id, class_id]
    );

    if (classChildResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Child is not assigned to this class' });
    }

    // Get display_order from category_presentations if not provided
    let finalDisplayOrder = display_order || 0;
    if (category && !display_order) {
      // Get the class's age_group to lookup correct category presentations
      const classResult = await client.query('SELECT age_group FROM classes WHERE id = $1', [
        class_id,
      ]);

      if (classResult.rows.length > 0) {
        const ageGroup = classResult.rows[0].age_group;
        const orderResult = await client.query(
          'SELECT display_order FROM category_presentations WHERE category = $1 AND age_group = $2 ORDER BY display_order ASC LIMIT 1',
          [category, ageGroup]
        );
        if (orderResult.rows.length > 0) {
          finalDisplayOrder = orderResult.rows[0].display_order;
        }
      }
    }

    const result = await client.query(
      `
      INSERT INTO presentations (child_id, class_id, name, category, display_order, status, notes, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING *
    `,
      [
        child_id,
        class_id,
        name,
        category,
        finalDisplayOrder,
        status || 'prerequisites not met',
        notes,
        req.user.id,
      ]
    );

    await normalizeCategoryOrdering(client, child_id, category);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch((rollbackErr) => {
        console.error('Error rolling back transaction:', rollbackErr);
      });
    }
    console.error('Error creating presentation:', err);
    res.status(500).json({ error: 'Failed to create presentation entry' });
  } finally {
    client?.release();
  }
});

export default router;
