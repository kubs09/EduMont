import { Router } from 'express';
const router = Router();
import console from 'console';
import { eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { users } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';
import validationService from './services/validation.js';
import passwordService from './services/password.js';

const { validateUserProfile } = validationService;
const { hashPassword, comparePassword } = passwordService;

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (parseInt(id) !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { firstname, surname, email, phone } = req.body;

    const validation = validateUserProfile({ firstname, surname, email, phone });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const result = await db
      .update(users)
      .set({
        firstname,
        surname,
        email: email.toLowerCase(),
        phone: phone || null,
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        firstname: users.firstname,
        surname: users.surname,
        email: users.email,
        phone: users.phone,
        role: users.role,
      });

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.put('/:id/password', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (parseInt(id) !== userId) {
      return res.status(403).json({ error: 'You can only change your own password' });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await comparePassword(currentPassword, user[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.put('/:id/notifications', auth, async (req, res) => {
  try {
    const { messageNotifications } = req.body;
    const userId = parseInt(req.params.id);

    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update other users settings' });
    }

    const result = await db
      .update(users)
      .set({ messageNotifications })
      .where(eq(users.id, userId))
      .returning({ messageNotifications: users.messageNotifications });

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ messageNotifications: result[0].messageNotifications });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

export default router;
