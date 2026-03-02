import { Router } from 'express';
const router = Router();
import console from 'console';
import pool from '../../config/database.js';
import tokenService from './services/token.js';
import emailService from './services/email.js';
import validationService from './services/validation.js';

const { generateResetToken } = tokenService;
const { sendPasswordResetEmail } = emailService;
const { validateForgotPasswordData } = validationService;

router.post('/forgot-password', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, language } = req.body;

    const validation = validateForgotPasswordData(email);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const userResult = await client.query(
      'SELECT id, firstname, surname, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.json({ success: true });
    }

    const user = userResult.rows[0];
    const resetToken = generateResetToken();

    await client.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = NOW() + interval '1 hour' WHERE id = $2",
      [resetToken, user.id]
    );

    await sendPasswordResetEmail(user.email, resetToken, language);

    return res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
    });
  } finally {
    client.release();
  }
});

export default router;
