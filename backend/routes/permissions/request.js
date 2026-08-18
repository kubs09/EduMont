import { Router } from 'express';
const router = Router();
import console from 'console';
import process from 'process';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import {
  classTeachers,
  classes,
  messages,
  presentationPermissions,
  users,
} from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.get('/check', auth, async (req, res) => {
  try {
    const resource_id = Number(req.query.resource_id);
    const requester_id = req.user.id;
    const requester_role = req.user.role;

    if (!Number.isInteger(resource_id) || resource_id <= 0) {
      return res.status(400).json({ error: 'resource_id must be a positive integer' });
    }

    if (requester_role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can check permission requests' });
    }

    const classResult = await db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.id, resource_id));

    if (classResult.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const existingRequestCheck = await db
      .select({ id: presentationPermissions.id })
      .from(presentationPermissions)
      .where(
        and(
          eq(presentationPermissions.classId, resource_id),
          eq(presentationPermissions.adminId, requester_id),
          eq(presentationPermissions.permissionRequested, true)
        )
      );

    res.json({
      already_requested: existingRequestCheck.length > 0,
    });
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({
      error: 'Failed to check permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/granted', auth, async (req, res) => {
  try {
    const resource_id = Number(req.query.resource_id);
    const user_id = req.user.id;
    const user_role = req.user.role;

    if (!Number.isInteger(resource_id) || resource_id <= 0) {
      return res.status(400).json({ error: 'resource_id must be a positive integer' });
    }

    if (user_role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can check presentation permissions' });
    }

    const permissionCheck = await db
      .select({ granted: presentationPermissions.granted })
      .from(presentationPermissions)
      .where(
        and(
          eq(presentationPermissions.classId, resource_id),
          eq(presentationPermissions.adminId, user_id)
        )
      );

    const hasAccess = permissionCheck.length > 0 && permissionCheck[0].granted === true;

    res.json({
      has_access: hasAccess,
    });
  } catch (error) {
    console.error('Permission granted check error:', error);
    res.status(500).json({
      error: 'Failed to check presentation permission',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/pending', auth, async (req, res) => {
  try {
    const class_id = Number(req.query.class_id);
    const user_id = req.user.id;
    const user_role = req.user.role;

    if (!Number.isInteger(class_id) || class_id <= 0) {
      return res.status(400).json({ error: 'class_id must be a positive integer' });
    }

    const teacherCheck = await db
      .select({ classId: classTeachers.classId })
      .from(classTeachers)
      .where(and(eq(classTeachers.classId, class_id), eq(classTeachers.teacherId, user_id)));

    if (teacherCheck.length === 0 && user_role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this class' });
    }

    const pendingRequests = await db
      .select({
        id: presentationPermissions.id,
        admin_id: presentationPermissions.adminId,
        class_id: presentationPermissions.classId,
        permission_requested: presentationPermissions.permissionRequested,
        granted: presentationPermissions.granted,
        created_at: presentationPermissions.createdAt,
        updated_at: presentationPermissions.updatedAt,
        firstname: users.firstname,
        surname: users.surname,
        email: users.email,
      })
      .from(presentationPermissions)
      .innerJoin(users, eq(presentationPermissions.adminId, users.id))
      .where(
        and(
          eq(presentationPermissions.classId, class_id),
          eq(presentationPermissions.permissionRequested, true),
          eq(presentationPermissions.granted, false)
        )
      );

    res.json({
      has_pending: pendingRequests.length > 0,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error('Pending permission check error:', error);
    res.status(500).json({
      error: 'Failed to check pending permission requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/request', auth, async (req, res) => {
  try {
    const { resource_type, reason, language } = req.body;
    const resource_id = Number(req.body.resource_id);
    const requester_id = req.user.id;
    const requester_role = req.user.role;

    if (!Number.isInteger(resource_id) || resource_id <= 0) {
      return res.status(400).json({ error: 'resource_id must be a positive integer' });
    }

    if (requester_role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can request permissions' });
    }

    const requesterResult = await db
      .select({ firstname: users.firstname, surname: users.surname, email: users.email })
      .from(users)
      .where(eq(users.id, requester_id));

    if (requesterResult.length === 0) {
      return res.status(404).json({ error: 'Requester not found' });
    }

    const requester = requesterResult[0];
    const requesterName = `${requester.firstname} ${requester.surname}`;

    const result = await db.transaction(async (tx) => {
      const classResult = await tx
        .select({ id: classes.id, name: classes.name })
        .from(classes)
        .where(eq(classes.id, resource_id));

      if (classResult.length === 0) {
        return { status: 404, body: { error: 'Class not found' } };
      }

      const className = classResult[0].name;

      const teachersResult = await tx
        .select({
          id: users.id,
          firstname: users.firstname,
          surname: users.surname,
          email: users.email,
          class_role: classTeachers.role,
        })
        .from(classTeachers)
        .innerJoin(users, eq(classTeachers.teacherId, users.id))
        .where(eq(classTeachers.classId, resource_id));

      const upsertResult = await tx
        .insert(presentationPermissions)
        .values({
          classId: resource_id,
          adminId: requester_id,
          permissionRequested: true,
          granted: false,
        })
        .onConflictDoUpdate({
          target: [presentationPermissions.adminId, presentationPermissions.classId],
          set: {
            permissionRequested: true,
            granted: false,
            updatedAt: new Date(),
          },
          setWhere: sql`${presentationPermissions.permissionRequested} is distinct from true`,
        })
        .returning({ id: presentationPermissions.id });

      if (upsertResult.length === 0) {
        return {
          status: 200,
          body: {
            message: 'Permission request already exists and is pending',
            already_requested: true,
          },
        };
      }

      const subjectEn = 'Permission Request';
      const subjectCs = 'Žádost o oprávnění';
      const subject = language === 'cs' ? subjectCs : subjectEn;

      let content = '';
      if (language === 'cs') {
        content = `Administrátor ${requesterName} (${requester.email}) požádal o oprávnění k prezentacím.\n\n`;
        content += `Třída: ${className}\n`;
        if (resource_type) {
          content += `Typ zdroje: ${resource_type}\n`;
        }
        if (reason) {
          content += `Důvod: ${reason}\n`;
        }
        content += `\nČas žádosti: ${new Date().toLocaleString('cs-CZ')}`;
      } else {
        content = `Administrator ${requesterName} (${requester.email}) has requested permission to access presentations.\n\n`;
        content += `Class: ${className}\n`;
        if (resource_type) {
          content += `Resource Type: ${resource_type}\n`;
        }
        if (reason) {
          content += `Reason: ${reason}\n`;
        }
        content += `\nRequest Time: ${new Date().toLocaleString('en-US')}`;
      }

      if (teachersResult.length > 0) {
        await tx.insert(messages).values(
          teachersResult.map((teacher) => ({
            fromUserId: requester_id,
            toUserId: teacher.id,
            subject,
            content,
          }))
        );
      } else {
        await tx.insert(messages).values({
          fromUserId: requester_id,
          toUserId: requester_id,
          subject: `[SYSTEM LOG] ${subject}`,
          content,
        });
      }

      return {
        status: 201,
        body: {
          message: 'Permission request sent successfully',
          recipients_count: teachersResult.length || 1,
          already_requested: false,
        },
      };
    });

    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Permission request error:', error);
    res.status(500).json({
      error: 'Failed to send permission request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
