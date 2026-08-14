import { Router } from 'express';
const router = Router();
import { eq, isNull } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { classChildren, classTeachers, classes, children } from '#backend/db/schema.js';
import auth from '#backend/middleware/auth.js';

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can create classes' });
  }
  try {
    const { name, description, age_group, min_age, max_age, teacherId, assistantId } = req.body;

    if (!teacherId) {
      throw new Error('Missing required field: teacherId is required');
    }

    if (assistantId && assistantId === teacherId) {
      throw new Error('Assistant cannot be the same as the main teacher');
    }

    const classId = await db.transaction(async (tx) => {
      const assignedTeacher = await tx
        .select({ classId: classTeachers.classId })
        .from(classTeachers)
        .where(eq(classTeachers.teacherId, teacherId))
        .limit(1);

      if (assignedTeacher.length > 0) {
        throw new Error('Selected teacher is already assigned to another class');
      }

      if (assistantId) {
        const assignedAssistant = await tx
          .select({ classId: classTeachers.classId })
          .from(classTeachers)
          .where(eq(classTeachers.teacherId, assistantId))
          .limit(1);

        if (assignedAssistant.length > 0) {
          throw new Error('Selected assistant is already assigned to another class');
        }
      }

      const classResult = await tx
        .insert(classes)
        .values({ name, description, ageGroup: age_group, minAge: min_age, maxAge: max_age })
        .returning({ id: classes.id });
      const newClassId = classResult[0].id;

      await tx.insert(classTeachers).values({
        classId: newClassId,
        teacherId,
        role: 'teacher',
        permissionRequested: false,
      });

      if (assistantId) {
        await tx.insert(classTeachers).values({
          classId: newClassId,
          teacherId: assistantId,
          role: 'assistant',
          permissionRequested: false,
        });
      }

      return newClassId;
    });

    res.status(201).json({ id: classId });
  } catch (error) {
    if (
      error.message.includes('Selected teacher is already assigned') ||
      error.message.includes('Selected assistant is already assigned') ||
      error.message.includes('Assistant cannot be the same') ||
      error.message.includes('Missing required field')
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to create class',
      details: error.message,
    });
  }
});

// Auto-assign children to classes based on age
router.post('/auto-assign', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can trigger auto-assignment' });
  }
  try {
    await db.transaction(async (tx) => {
      // First, clear all previous assignments
      await tx.delete(classChildren);

      // Get all children who aren't assigned to any class
      const unassignedChildren = await tx
        .select({ id: children.id, dateOfBirth: children.dateOfBirth })
        .from(children)
        .leftJoin(classChildren, eq(classChildren.childId, children.id))
        .where(isNull(classChildren.childId));

      // Get all classes with their age ranges
      const allClasses = await tx
        .select({ id: classes.id, minAge: classes.minAge, maxAge: classes.maxAge })
        .from(classes)
        .orderBy(classes.minAge, classes.maxAge, classes.name);

      // For each child, find the most appropriate class based on age
      for (const child of unassignedChildren) {
        const age = calculateAge(child.dateOfBirth);
        // Find the most appropriate class for this age
        const suitableClass = allClasses.find((c) => age >= c.minAge && age <= c.maxAge);

        if (suitableClass) {
          await tx
            .insert(classChildren)
            .values({ classId: suitableClass.id, childId: child.id })
            .onConflictDoUpdate({
              target: [classChildren.classId, classChildren.childId],
              set: { createdAt: new Date() },
            });
        }
      }
    });

    res.json({ message: 'Automatic class assignment completed' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to perform automatic class assignment',
      details: error.message,
    });
  }
});

export default router;
