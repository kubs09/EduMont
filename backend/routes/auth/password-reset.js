import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { users } from '#backend/db/schema.js';
import tokenService from './services/token.js';
import emailService from './services/email.js';
import validationService from './services/validation.js';
import passwordService from './services/password.js';

const { generateResetToken } = tokenService;
const { sendPasswordResetEmail } = emailService;
const { validateForgotPasswordData } = validationService;
const { hashPassword } = passwordService;

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, language } = req.body;

    const validation = validateForgotPasswordData(email);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const userResult = await db
      .select({
        id: users.id,
        firstname: users.firstname,
        surname: users.surname,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userResult.length === 0) {
      return res.json({ success: true });
    }

    const user = userResult[0];
    const resetToken = generateResetToken();

    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      })
      .where(eq(users.id, user.id));

    await sendPasswordResetEmail(user.email, resetToken, language);

    return res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
    });
  }
});

router.get('/check-token/:token', async (req, res) => {
  let { token } = req.params;

  try {
    token = decodeURIComponent(token);
    if (token.includes('=')) {
      token = token.split('=').pop();
    }

    const result = await db
      .select({
        id: users.id,
        resetToken: users.resetToken,
        resetTokenExpiry: users.resetTokenExpiry,
      })
      .from(users)
      .where(eq(users.resetToken, token));

    res.json({
      valid: result.length > 0,
      expired: result[0]?.resetTokenExpiry < new Date(),
    });
  } catch (error) {
    console.error('Check token error:', error);
    res.status(500).json({ error: 'Failed to check token' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    if (!token || token.length !== 64) {
      return res.status(400).json({ error: 'Invalid reset token format' });
    }

    const result = await db.transaction(async (tx) => {
      const checkResult = await tx
        .select({
          id: users.id,
          resetToken: users.resetToken,
          resetTokenExpiry: users.resetTokenExpiry,
        })
        .from(users)
        .where(eq(users.resetToken, token));

      if (checkResult.length === 0) {
        return { error: 'Invalid or expired reset token' };
      }

      const userId = checkResult[0].id;
      const tokenExpiry = checkResult[0].resetTokenExpiry;

      if (tokenExpiry < new Date()) {
        return { error: 'Reset token has expired' };
      }

      const hashedPassword = await hashPassword(password);

      const updateResult = await tx
        .update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(and(eq(users.id, userId), eq(users.resetToken, token)))
        .returning({ id: users.id });

      if (updateResult.length === 0) {
        return { error: 'Failed to update password' };
      }

      return { success: true };
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
