import { and, eq } from 'drizzle-orm';
import console from 'console';
import { db } from '#backend/config/database.js';
import { childParents, classChildren, classTeachers, children } from '#backend/db/schema.js';

const validateDocument = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (data.title && data.title.length > 200) {
    errors.push('Title must not exceed 200 characters');
  }

  if (!data.file_url || typeof data.file_url !== 'string' || data.file_url.trim().length === 0) {
    errors.push('File URL is required and must be a non-empty string');
  }

  if (data.file_name && data.file_name.length > 255) {
    errors.push('File name must not exceed 255 characters');
  }

  if (data.mime_type && data.mime_type.length > 100) {
    errors.push('MIME type must not exceed 100 characters');
  }

  if (data.description && data.description.length > 1000) {
    errors.push('Description must not exceed 1000 characters');
  }

  if (
    data.size_bytes !== undefined &&
    (!Number.isInteger(data.size_bytes) || data.size_bytes < 0)
  ) {
    errors.push('Size must be a non-negative integer');
  }

  if (data.class_id !== undefined && !Number.isInteger(data.class_id)) {
    errors.push('Class ID must be a valid number');
  }

  if (data.child_id !== undefined && !Number.isInteger(data.child_id)) {
    errors.push('Child ID must be a valid number');
  }

  if (!data.class_id && !data.child_id) {
    errors.push('Document must be associated with a class or a child');
  }

  return errors;
};

const canAccessDocumentByIds = async (userId, userRole, childId, classId) => {
  const numericUserId = Number(userId);
  const numericChildId = childId === null || childId === undefined ? null : Number(childId);
  const numericClassId = classId === null || classId === undefined ? null : Number(classId);

  if (userRole === 'admin') return true;

  if (userRole === 'teacher') {
    if (numericClassId) {
      const result = await db
        .select({ id: classTeachers.classId })
        .from(classTeachers)
        .where(
          and(eq(classTeachers.classId, numericClassId), eq(classTeachers.teacherId, numericUserId))
        )
        .limit(1);
      return result.length > 0;
    }

    if (numericChildId) {
      const result = await db
        .select({ id: classTeachers.classId })
        .from(classTeachers)
        .innerJoin(classChildren, eq(classTeachers.classId, classChildren.classId))
        .where(
          and(eq(classTeachers.teacherId, numericUserId), eq(classChildren.childId, numericChildId))
        )
        .limit(1);
      return result.length > 0;
    }
  }

  if (userRole === 'parent') {
    if (numericChildId) {
      const result = await db
        .select({ id: childParents.childId })
        .from(childParents)
        .where(
          and(eq(childParents.childId, numericChildId), eq(childParents.parentId, numericUserId))
        )
        .limit(1);
      return result.length > 0;
    }

    if (numericClassId) {
      const result = await db
        .select({ id: classChildren.classId })
        .from(classChildren)
        .innerJoin(children, eq(classChildren.childId, children.id))
        .innerJoin(childParents, eq(childParents.childId, children.id))
        .where(
          and(eq(classChildren.classId, numericClassId), eq(childParents.parentId, numericUserId))
        )
        .limit(1);
      return result.length > 0;
    }
  }

  return false;
};

const canEditDocumentByIds = async (userId, userRole, childId, classId) => {
  if (userRole === 'admin') return true;
  return canAccessDocumentByIds(userId, userRole, childId, classId);
};

const ensureChildInClass = async (childId, classId) => {
  if (!childId || !classId) return true;

  try {
    const result = await db
      .select({ id: classChildren.childId })
      .from(classChildren)
      .where(
        and(eq(classChildren.childId, Number(childId)), eq(classChildren.classId, Number(classId)))
      )
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error('Error checking child in class:', error);
    return false;
  }
};

export { validateDocument, canAccessDocumentByIds, canEditDocumentByIds, ensureChildInClass };

export default {
  validateDocument,
  canAccessDocumentByIds,
  canEditDocumentByIds,
  ensureChildInClass,
};
