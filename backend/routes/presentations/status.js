import { Router } from 'express';
const router = Router();
import pool from '#backend/config/database.js';
import console from 'console';
import authenticateToken from '#backend/middleware/auth.js';
import validation from './validation.js';
const { STATUS_VALUES, canEditChildpresentation, normalizeCategoryOrdering } = validation;

router.put('/children/:childId/:presentationId/status', authenticateToken, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const childId = Number(req.params.childId);
    const presentationId = Number(req.params.presentationId);
    const { status, notes } = req.body || {};

    if (!Number.isInteger(childId) || !Number.isInteger(presentationId)) {
      return res.status(400).json({ error: 'Invalid child or presentation ID' });
    }

    if (!status || !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes must be a string or null' });
    }
    if (typeof notes === 'string' && notes.length > 1000) {
      return res.status(400).json({ error: 'Notes must not exceed 1000 characters' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, childId);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's presentation" });
    }

    const presentationResult = await client.query(
      'SELECT id, category FROM presentations WHERE id = $1 AND child_id = $2',
      [presentationId, childId]
    );

    if (presentationResult.rows.length === 0) {
      return res.status(404).json({ error: 'presentation not found for this child' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `
      UPDATE presentations
      SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP, updated_by = $3
      WHERE id = $4
      RETURNING *
    `,
      [status, typeof notes === 'string' ? notes : null, req.user.id, presentationId]
    );

    await normalizeCategoryOrdering(client, childId, presentationResult.rows[0].category);

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {
        res.status(500).json({ error: 'Failed to update presentation status' });
      });
    }
    console.error('Error updating presentation status:', error);
    res.status(500).json({ error: 'Failed to update presentation status' });
  } finally {
    client?.release();
  }
});

router.put('/children/:childId/:presentationId/reorder', authenticateToken, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const childId = Number(req.params.childId);
    const presentationId = Number(req.params.presentationId);
    const { direction } = req.body || {};

    if (!Number.isInteger(childId) || !Number.isInteger(presentationId)) {
      return res.status(400).json({ error: 'Invalid child or presentation ID' });
    }

    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction. Must be "up" or "down"' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, childId);
    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this child's presentation" });
    }

    const presentationResult = await client.query(
      'SELECT id, category, display_order FROM presentations WHERE id = $1 AND child_id = $2',
      [presentationId, childId]
    );

    if (presentationResult.rows.length === 0) {
      return res.status(404).json({ error: 'presentation not found for this child' });
    }

    const currentpresentation = presentationResult.rows[0];
    const currentOrder = currentpresentation.display_order;

    await client.query('BEGIN');

    if (direction === 'up') {
      const adjacentResult = await client.query(
        'SELECT id FROM presentations WHERE child_id = $1 AND category = $2 AND display_order < $3 ORDER BY display_order DESC LIMIT 1',
        [childId, currentpresentation.category, currentOrder]
      );

      if (adjacentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot move up: already at the top' });
      }

      const adjacentId = adjacentResult.rows[0].id;

      await client.query(
        'UPDATE presentations SET display_order = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
        [currentOrder - 1, req.user.id, presentationId]
      );

      await client.query(
        'UPDATE presentations SET display_order = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
        [currentOrder, req.user.id, adjacentId]
      );
    } else {
      const adjacentResult = await client.query(
        'SELECT id FROM presentations WHERE child_id = $1 AND category = $2 AND display_order > $3 ORDER BY display_order ASC LIMIT 1',
        [childId, currentpresentation.category, currentOrder]
      );

      if (adjacentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot move down: already at the bottom' });
      }

      const adjacentId = adjacentResult.rows[0].id;

      await client.query(
        'UPDATE presentations SET display_order = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
        [currentOrder + 1, req.user.id, presentationId]
      );

      await client.query(
        'UPDATE presentations SET display_order = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3',
        [currentOrder, req.user.id, adjacentId]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Presentation moved ${direction}` });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {
        res.status(500).json({ error: 'Failed to reorder presentations' });
      });
    }
    console.error('Error reordering presentations:', error);
    res.status(500).json({ error: 'Failed to reorder presentations' });
  } finally {
    client?.release();
  }
});

export default router;
