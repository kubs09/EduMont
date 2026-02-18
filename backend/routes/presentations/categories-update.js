/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

router.put('/categories/:id', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { category, name, age_group, display_order, notes } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid presentation ID' });
    }

    const existsQuery =
      'SELECT id, category, age_group, display_order FROM category_presentations WHERE id = $1';
    const existsResult = await client.query(existsQuery, [id]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category presentation not found' });
    }

    const currentPresentation = existsResult.rows[0];
    const isReordering =
      display_order !== undefined && display_order !== currentPresentation.display_order;

    await client.query('BEGIN');

    if (isReordering) {
      const newCategory = category !== undefined ? category : currentPresentation.category;
      const newAgeGroup = age_group !== undefined ? age_group : currentPresentation.age_group;
      const oldCategory = currentPresentation.category;
      const oldAgeGroup = currentPresentation.age_group;
      const oldOrder = currentPresentation.display_order;
      const newOrder = display_order;

      if (newCategory !== oldCategory || newAgeGroup !== oldAgeGroup) {
        await client.query(
          `UPDATE category_presentations
           SET display_order = -(display_order - 1)
           WHERE category = $1 AND age_group = $2 AND display_order > $3 AND id != $4`,
          [oldCategory, oldAgeGroup, oldOrder, id]
        );

        await client.query(
          `UPDATE category_presentations
           SET display_order = -display_order
           WHERE category = $1 AND age_group = $2 AND display_order < 0 AND id != $3`,
          [oldCategory, oldAgeGroup, id]
        );

        await client.query(
          `UPDATE category_presentations
           SET display_order = -(display_order + 1)
           WHERE category = $1 AND age_group = $2 AND display_order >= $3 AND id != $4`,
          [newCategory, newAgeGroup, newOrder, id]
        );

        await client.query(
          `UPDATE category_presentations
           SET display_order = -display_order
           WHERE category = $1 AND age_group = $2 AND display_order < 0 AND id != $3`,
          [newCategory, newAgeGroup, id]
        );
      } else {
        await client.query(
          `UPDATE category_presentations
           SET display_order = -999999
           WHERE id = $1`,
          [id]
        );

        if (newOrder > oldOrder) {
          await client.query(
            `UPDATE category_presentations
             SET display_order = -(display_order - 1)
             WHERE category = $1 AND age_group = $2 AND display_order > $3 AND display_order <= $4 AND id != $5`,
            [newCategory, newAgeGroup, oldOrder, newOrder, id]
          );

          await client.query(
            `UPDATE category_presentations
             SET display_order = -display_order
             WHERE category = $1 AND age_group = $2 AND display_order < 0 AND id != $3`,
            [newCategory, newAgeGroup, id]
          );
        } else if (newOrder < oldOrder) {
          await client.query(
            `UPDATE category_presentations
             SET display_order = -(display_order + 1)
             WHERE category = $1 AND age_group = $2 AND display_order >= $3 AND display_order < $4 AND id != $5`,
            [newCategory, newAgeGroup, newOrder, oldOrder, id]
          );

          await client.query(
            `UPDATE category_presentations
             SET display_order = -display_order
             WHERE category = $1 AND age_group = $2 AND display_order < 0 AND id != $3`,
            [newCategory, newAgeGroup, id]
          );
        }
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (category !== undefined) {
      if (typeof category !== 'string') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Category must be a string' });
      }
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    if (age_group !== undefined) {
      if (typeof age_group !== 'string') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Age group must be a string' });
      }
      updates.push(`age_group = $${paramCount}`);
      values.push(age_group);
      paramCount++;
    }

    if (name !== undefined) {
      if (typeof name !== 'string') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Name must be a string' });
      }
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      values.push(notes || null);
      paramCount++;
    }

    if (display_order !== undefined) {
      if (typeof display_order !== 'number' || display_order < 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Display order must be a positive number' });
      }
      updates.push(`display_order = $${paramCount}`);
      values.push(display_order);
      paramCount++;
    }

    if (updates.length > 0) {
      values.push(id);
      const query = `
        UPDATE category_presentations
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
      `;
      await client.query(query, values);
    }

    const resultQuery = `
      SELECT id, category, name, age_group, display_order, notes, created_at
      FROM category_presentations
      WHERE id = $1
    `;
    const result = await client.query(resultQuery, [id]);

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '23505') {
      return res.status(400).json({
        error: 'A presentation with this category and display order already exists',
      });
    }
    console.error('Error updating category presentation:', error);
    res.status(500).json({ error: 'Failed to update category presentation' });
  } finally {
    client.release();
  }
});

module.exports = router;
