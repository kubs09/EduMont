/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const auth = require('../../middleware/auth');

// Update a category presentation
router.put('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { category, name, age_group, display_order, notes } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid presentation ID' });
    }

    // Check if presentation exists
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

    // If reordering within same category or changing category
    if (isReordering) {
      const newCategory = category !== undefined ? category : currentPresentation.category;
      const newAgeGroup = age_group !== undefined ? age_group : currentPresentation.age_group;

      // Use a temporary high value to avoid unique constraint violations
      const tempOrder = 999999;

      // Step 1: Update the current presentation to temp order
      await client.query('UPDATE category_presentations SET display_order = $1 WHERE id = $2', [
        tempOrder,
        id,
      ]);

      // Step 2: Update the presentation that will be displaced (if any)
      const conflictQuery = `
        SELECT id FROM category_presentations 
        WHERE category = $1 AND age_group = $2 AND display_order = $3 AND id != $4
        LIMIT 1
      `;
      const conflictResult = await client.query(conflictQuery, [
        newCategory,
        newAgeGroup,
        display_order,
        id,
      ]);

      if (conflictResult.rows.length > 0) {
        const conflictId = conflictResult.rows[0].id;
        // Move the conflicting presentation to the old order
        await client.query('UPDATE category_presentations SET display_order = $1 WHERE id = $2', [
          currentPresentation.display_order,
          conflictId,
        ]);
      }

      // Step 3: Update the current presentation to final order
      await client.query('UPDATE category_presentations SET display_order = $1 WHERE id = $2', [
        display_order,
        id,
      ]);
    }

    // Build update query for other fields
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

    // Execute updates for other fields
    if (updates.length > 0) {
      values.push(id);
      const query = `
        UPDATE category_presentations
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
      `;
      await client.query(query, values);
    }

    // Fetch and return updated record
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
      // Unique constraint violation
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
