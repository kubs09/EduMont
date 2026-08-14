import { Router } from 'express';
const router = Router();
import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { classTeachers, classes, users } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update classes' });
  }
  try {
    const { id } = req.params;
    const classId = Number(id);

    if (!Number.isInteger(classId) || classId <= 0) {
      throw new Error('Invalid class ID');
    }
    const { name, description, min_age, max_age, teacherId, assistantId } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Missing required field: name is required and must be a non-empty string');
    }
    if (!teacherId) {
      throw new Error('Missing required field: teacherId is required');
    }

    const teacherIdNum = Number(teacherId);
    const assistantIdNum =
      assistantId === undefined || assistantId === null || assistantId === ''
        ? null
        : Number(assistantId);

    if (
      !Number.isInteger(teacherIdNum) ||
      teacherIdNum <= 0 ||
      (assistantIdNum !== null && (assistantIdNum <= 0 || !Number.isInteger(assistantIdNum)))
    ) {
      throw new Error('Invalid teacher identifiers');
    }

    const minAge = Number(min_age);
    const maxAge = Number(max_age);

    if (isNaN(minAge) || isNaN(maxAge) || minAge < 0 || maxAge < minAge) {
      throw new Error('Invalid age range values');
    }

    if (assistantIdNum !== null && assistantIdNum === teacherIdNum) {
      throw new Error('Assistant cannot be the same as the main teacher');
    }

    const updatedClass = await db.transaction(async (tx) => {
      const updateResult = await tx
        .update(classes)
        .set({ name, description, minAge, maxAge })
        .where(eq(classes.id, classId))
        .returning({ id: classes.id });
      if (updateResult.length === 0) {
        throw new Error('Class not found');
      }

      const assignedTeacher = await tx
        .select({ classId: classTeachers.classId })
        .from(classTeachers)
        .where(and(eq(classTeachers.teacherId, teacherIdNum), ne(classTeachers.classId, classId)))
        .limit(1);
      if (assignedTeacher.length > 0) {
        throw new Error('Selected teacher is already assigned to another class');
      }

      if (assistantIdNum !== null) {
        const assignedAssistant = await tx
          .select({ classId: classTeachers.classId })
          .from(classTeachers)
          .where(
            and(eq(classTeachers.teacherId, assistantIdNum), ne(classTeachers.classId, classId))
          )
          .limit(1);

        if (assignedAssistant.length > 0) {
          throw new Error('Selected assistant is already assigned to another class');
        }
      }

      const currentTeachers = await tx
        .select({ teacherId: classTeachers.teacherId, role: classTeachers.role })
        .from(classTeachers)
        .where(eq(classTeachers.classId, classId));

      const currentTeacher = currentTeachers.find((r) => r.role === 'teacher');
      const currentAssistant = currentTeachers.find((r) => r.role === 'assistant');

      const teacherChanged = !currentTeacher || Number(currentTeacher.teacherId) !== teacherIdNum;
      const assistantChanged =
        assistantIdNum !== null
          ? !currentAssistant || Number(currentAssistant.teacherId) !== assistantIdNum
          : !!currentAssistant;

      await tx.delete(classTeachers).where(eq(classTeachers.classId, classId));

      await tx.insert(classTeachers).values({
        classId,
        teacherId: teacherIdNum,
        role: 'teacher',
        permissionRequested: teacherChanged,
      });

      if (assistantIdNum !== null) {
        await tx.insert(classTeachers).values({
          classId,
          teacherId: assistantIdNum,
          role: 'assistant',
          permissionRequested: assistantChanged,
        });
      }

      const rows = await tx
        .select({
          id: classes.id,
          name: classes.name,
          description: classes.description,
          ageGroup: classes.ageGroup,
          minAge: classes.minAge,
          maxAge: classes.maxAge,
          createdAt: classes.createdAt,
          teachers: sql`COALESCE(
            json_agg(
              json_build_object(
                'id', ${users.id},
                'firstname', ${users.firstname},
                'surname', ${users.surname},
                'class_role', ${classTeachers.role},
                'permission_requested', ${classTeachers.permissionRequested}
              )
            ) FILTER (WHERE ${users.id} IS NOT NULL),
            '[]'
          )`,
        })
        .from(classes)
        .leftJoin(classTeachers, eq(classes.id, classTeachers.classId))
        .leftJoin(users, eq(classTeachers.teacherId, users.id))
        .where(eq(classes.id, classId))
        .groupBy(classes.id);

      return rows[0];
    });

    res.json(updatedClass);
  } catch (error) {
    if (
      error.message.includes('Selected teacher is already assigned') ||
      error.message.includes('Selected assistant is already assigned') ||
      error.message.includes('Assistant cannot be the same') ||
      error.message.includes('Invalid teacher identifiers') ||
      error.message.includes('Missing required field') ||
      error.message.includes('Invalid age range values') ||
      error.message.includes('Missing required fields') ||
      error.message.includes('Invalid class ID')
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    if (error.message.includes('Class not found')) {
      return res.status(404).json({
        error: 'Class not found',
      });
    }

    res.status(500).json({
      error: 'Failed to update class',
      details: error.message,
    });
  }
});

export default router;
