import { Router } from 'express';
const router = Router();
import pool from '#backend/config/database.js';
import console from 'console';
import authenticateToken from '#backend/middleware/auth.js';
import validation from './validation.js';
const { canEditChildpresentation, normalizeDisplayOrder } = validation;

// Delete a presentation entry
router.delete('/:id', authenticateToken, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { id } = req.params;

    await client.query('BEGIN');

    const presentationResult = await client.query(
      'SELECT child_id, category FROM presentations WHERE id = $1',
      [id]
    );
    if (presentationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'presentation not found' });
    }

    const childId = presentationResult.rows[0].child_id;
    const category = presentationResult.rows[0].category;

    // Check if user can edit this child's presentation
    const canEdit = await canEditChildpresentation(req.user.id, req.user.role, childId);
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'You do not have permission to delete this presentation entry' });
    }

    // Delete the presentation
    await client.query('DELETE FROM presentations WHERE id = $1', [id]);

    await normalizeDisplayOrder(client, childId, category);

    await client.query('COMMIT');
    res.json({ message: 'presentation entry deleted successfully' });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch((rollbackErr) => {
        console.error('Error rolling back transaction:', rollbackErr);
      });
    }
    console.error('Error deleting presentation:', err);
    res.status(500).json({ error: 'Failed to delete presentation entry' });
  } finally {
    client?.release();
  }
});

export default router;
