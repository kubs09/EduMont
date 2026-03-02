import { Router } from 'express';
const router = Router();
import console from 'console';
import { query as _query } from '../../config/database.js';
import auth from '../../middleware/auth.js';

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

    const result = await _query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const result = await _query(
      'SELECT id, firstname, surname, email, role, phone FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = result.rows[0];
    const requesterRole = req.user.role;
    const isSelf = req.user.id === targetUser.id;
    const canViewProfile =
      requesterRole === 'admin' ||
      isSelf ||
      (requesterRole === 'parent' && targetUser.role === 'teacher') ||
      (requesterRole === 'teacher' && targetUser.role === 'parent') ||
      (requesterRole === 'teacher' && targetUser.role === 'teacher');

    if (!canViewProfile) {
      if (requesterRole === 'parent' && targetUser.role === 'parent') {
        const sharedChildResult = await _query(
          `SELECT 1
           FROM child_parents cp_self
           JOIN child_parents cp_other ON cp_self.child_id = cp_other.child_id
           WHERE cp_self.parent_id = $1 AND cp_other.parent_id = $2
           LIMIT 1`,
          [req.user.id, targetUser.id]
        );

        if (sharedChildResult.rows.length > 0) {
          return res.json(targetUser);
        }
      }

      return res.status(403).json({ error: 'Not authorized to view this profile' });
    }

    res.json(targetUser);
  } catch (error) {
    console.error('Fetch user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
