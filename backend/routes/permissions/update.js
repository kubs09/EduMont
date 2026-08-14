import { Router } from 'express';
const router = Router();
import console from 'console';
import process from 'process';
import { and, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { classTeachers, classes, messages, presentationPermissions, users } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.post('/accept', auth, async (req, res) => {
  try {
    const { class_id, language } = req.body;
    const approver_id = req.user.id;

    if (!Number.isInteger(class_id) || class_id <= 0) {
      return res.status(400).json({ error: 'class_id must be a positive integer' });
    }

    const result = await db.transaction(async (tx) => {
      const approverCheck = await tx
        .select({ classId: classTeachers.classId })
        .from(classTeachers)
        .where(and(eq(classTeachers.classId, class_id), eq(classTeachers.teacherId, approver_id)));

      if (approverCheck.length === 0) {
        return {
          status: 403,
          body: { error: 'You do not have permission to approve requests for this class' },
        };
      }

      const permissionCheck = await tx
        .select({
          adminId: presentationPermissions.adminId,
          firstname: users.firstname,
          surname: users.surname,
        })
        .from(presentationPermissions)
        .innerJoin(users, eq(presentationPermissions.adminId, users.id))
        .where(
          and(
            eq(presentationPermissions.classId, class_id),
            eq(presentationPermissions.permissionRequested, true)
          )
        )
        .for('update');

      if (permissionCheck.length === 0) {
        return { status: 404, body: { error: 'No pending permission request found for this class' } };
      }

      const requester_id = permissionCheck[0].adminId;

      const classResult = await tx
        .select({ name: classes.name })
        .from(classes)
        .where(eq(classes.id, class_id));
      const className = classResult[0]?.name || class_id;

      await tx
        .update(presentationPermissions)
        .set({ granted: true, updatedAt: new Date() })
        .where(
          and(
            eq(presentationPermissions.classId, class_id),
            eq(presentationPermissions.adminId, requester_id),
            eq(presentationPermissions.permissionRequested, true)
          )
        );

      const subjectEn = `Your permission request for class "${className}" has been accepted`;
      const subjectCs = `Vaše žádost o oprávnění pro třídu "${className}" byla přijata`;
      const subject = language === 'cs' ? subjectCs : subjectEn;

      const messageContent =
        language === 'cs'
          ? `Vaše žádost o oprávnění k prezentacím pro třídu "${className}" byla přijata. Nyní máte přístup k prezentacím.`
          : `Your permission request for presentations in class "${className}" has been accepted. You now have access to presentations.`;

      await tx.insert(messages).values({
        fromUserId: approver_id,
        toUserId: requester_id,
        subject,
        content: messageContent,
      });

      return { status: 200, body: { message: 'Permission request accepted successfully' } };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Permission accept error:', error);
    res.status(500).json({
      error: 'Failed to accept permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/deny', auth, async (req, res) => {
  try {
    const { class_id, language } = req.body;
    const denier_id = req.user.id;

    if (!Number.isInteger(class_id) || class_id <= 0) {
      return res.status(400).json({ error: 'class_id must be a positive integer' });
    }

    const result = await db.transaction(async (tx) => {
      const denierCheck = await tx
        .select({ classId: classTeachers.classId })
        .from(classTeachers)
        .where(and(eq(classTeachers.classId, class_id), eq(classTeachers.teacherId, denier_id)));

      if (denierCheck.length === 0) {
        return {
          status: 403,
          body: { error: 'You do not have permission to deny requests for this class' },
        };
      }

      const permissionCheck = await tx
        .select({
          adminId: presentationPermissions.adminId,
          firstname: users.firstname,
          surname: users.surname,
        })
        .from(presentationPermissions)
        .innerJoin(users, eq(presentationPermissions.adminId, users.id))
        .where(
          and(
            eq(presentationPermissions.classId, class_id),
            eq(presentationPermissions.permissionRequested, true)
          )
        )
        .for('update');

      if (permissionCheck.length === 0) {
        return { status: 404, body: { error: 'No pending permission request found for this class' } };
      }

      const requester_id = permissionCheck[0].adminId;

      const classResult = await tx
        .select({ name: classes.name })
        .from(classes)
        .where(eq(classes.id, class_id));
      const className = classResult[0]?.name || class_id;

      await tx
        .delete(presentationPermissions)
        .where(
          and(
            eq(presentationPermissions.classId, class_id),
            eq(presentationPermissions.adminId, requester_id)
          )
        );

      const subjectEn = `Your permission request for class "${className}" has been denied`;
      const subjectCs = `Vaše žádost o oprávnění pro třídu "${className}" byla zamítnuta`;
      const subject = language === 'cs' ? subjectCs : subjectEn;

      const messageContent =
        language === 'cs'
          ? `Vaše žádost o oprávnění k prezentacím pro třídu "${className}" byla zamítnuta.`
          : `Your permission request for presentations in class "${className}" has been denied.`;

      await tx.insert(messages).values({
        fromUserId: denier_id,
        toUserId: requester_id,
        subject,
        content: messageContent,
      });

      return { status: 200, body: { message: 'Permission request denied successfully' } };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Permission deny error:', error);
    res.status(500).json({
      error: 'Failed to deny permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
