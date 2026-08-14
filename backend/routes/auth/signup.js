import { Router } from 'express';
const router = Router();
import console from 'console';
import { eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { users } from '#backend/db/schema.js';
import passwordService from './services/password.js';
import validationService from './services/validation.js';

const { hashPassword } = passwordService;
const { validateSignupData } = validationService;

router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const validation = validateSignupData(email, password, firstName, lastName);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const normalizedEmail = email.toLowerCase();

    const newUser = await db.transaction(async (tx) => {
      const existingUser = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser.length > 0) {
        return null;
      }

      const hashedPassword = await hashPassword(password);

      const inserted = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          password: hashedPassword,
          firstname: firstName,
          surname: lastName,
          role: 'parent',
        })
        .returning({
          id: users.id,
          email: users.email,
          firstname: users.firstname,
          surname: users.surname,
          role: users.role,
        });

      return inserted[0];
    });

    if (!newUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

export default router;
