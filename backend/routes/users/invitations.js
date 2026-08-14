import { Router } from 'express';
const router = Router();
import console from 'console';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { invitations, users } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';
import passwordService from './services/password.js';
import emailService from './services/email.js';

const { hashPassword } = passwordService;
const { generateInvitationToken, createInvitationExpiry, sendInvitationEmail } = emailService;

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can send invitations' });
    }

    const { email, role, language } = req.body;

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'user_exists' });
    }

    const existingInvitation = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(and(eq(invitations.email, email), gt(invitations.expiresAt, new Date())))
      .limit(1);
    if (existingInvitation.length > 0) {
      return res.status(409).json({ error: 'invitation_exists' });
    }

    const token = generateInvitationToken();
    const expiresAt = createInvitationExpiry(48);

    await db.transaction(async (tx) => {
      await tx.insert(invitations).values({
        email,
        token,
        role,
        expiresAt,
      });

      await sendInvitationEmail(email, role, token, language);
    });

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

router.post('/register/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { firstname, surname, password } = req.body;

    const invitation = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
      })
      .from(invitations)
      .where(and(eq(invitations.token, token), gt(invitations.expiresAt, new Date())))
      .limit(1);

    if (invitation.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const { email, role } = invitation[0];

    const hashedPassword = await hashPassword(password);

    const result = await db.transaction(async (tx) => {
      const createdUsers = await tx
        .insert(users)
        .values({
          email,
          firstname,
          surname,
          password: hashedPassword,
          role,
        })
        .returning({ id: users.id, email: users.email, role: users.role });

      await tx.delete(invitations).where(eq(invitations.token, token));

      return createdUsers[0];
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

export default router;
