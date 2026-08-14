import { and, asc, eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { classChildren, classTeachers, presentations } from '#backend/db/schema.js';

const STATUS_VALUES = [
  'prerequisites not met',
  'to be presented',
  'presented',
  'practiced',
  'mastered',
];

const PRESENTED_STATUSES = new Set(['presented', 'practiced', 'mastered']);

const validatepresentation = (data) => {
  const errors = [];

  if (!data.child_id || !Number.isInteger(data.child_id)) {
    errors.push('Child ID is required and must be a valid number');
  }

  if (!data.class_id || !Number.isInteger(data.class_id)) {
    errors.push('Class ID is required and must be a valid number');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  if (data.name && data.name.length > 200) {
    errors.push('Name must not exceed 200 characters');
  }

  if (data.category && data.category.length > 100) {
    errors.push('Category must not exceed 100 characters');
  }

  if (data.status && !STATUS_VALUES.includes(data.status)) {
    errors.push(
      'Status must be "prerequisites not met", "to be presented", "presented", "practiced", or "mastered"'
    );
  }

  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes must not exceed 1000 characters');
  }

  return errors;
};

const normalizeCategoryOrdering = async (tx, childId, category) => {
  if (!category) return;

  const rows = await tx
    .select({ id: presentations.id, status: presentations.status })
    .from(presentations)
    .where(and(eq(presentations.childId, childId), eq(presentations.category, category)))
    .orderBy(asc(presentations.displayOrder), asc(presentations.id));

  if (rows.length === 0) return;

  const firstNotPresentedIndex = rows.findIndex((row) => !PRESENTED_STATUSES.has(row.status));

  if (firstNotPresentedIndex === -1) return;

  const updates = [];

  rows.forEach((row, index) => {
    let desiredStatus = row.status;

    if (index === firstNotPresentedIndex) {
      desiredStatus = 'to be presented';
    } else if (index > firstNotPresentedIndex) {
      desiredStatus = 'prerequisites not met';
    }

    if (desiredStatus !== row.status) {
      updates.push({ id: row.id, status: desiredStatus });
    }
  });

  for (const update of updates) {
    await tx
      .update(presentations)
      .set({ status: update.status, updatedAt: new Date() })
      .where(eq(presentations.id, update.id));
  }
};

const normalizeDisplayOrder = async (tx, childId, category) => {
  if (!category) return;

  const rows = await tx
    .select({ id: presentations.id })
    .from(presentations)
    .where(and(eq(presentations.childId, childId), eq(presentations.category, category)))
    .orderBy(asc(presentations.displayOrder), asc(presentations.id));

  for (let index = 0; index < rows.length; index += 1) {
    const desiredOrder = index + 1;
    await tx
      .update(presentations)
      .set({ displayOrder: desiredOrder, updatedAt: new Date() })
      .where(eq(presentations.id, rows[index].id));
  }
};

const canAccessChildpresentation = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'teacher') {
    const rows = await db
      .select({ id: classTeachers.classId })
      .from(classTeachers)
      .innerJoin(classChildren, eq(classTeachers.classId, classChildren.classId))
      .where(and(eq(classTeachers.teacherId, userId), eq(classChildren.childId, childId)))
      .limit(1);
    return rows.length > 0;
  }

  return false;
};

const canEditChildpresentation = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'teacher') {
    const rows = await db
      .select({ id: classTeachers.classId })
      .from(classTeachers)
      .innerJoin(classChildren, eq(classTeachers.classId, classChildren.classId))
      .where(and(eq(classTeachers.teacherId, userId), eq(classChildren.childId, childId)))
      .limit(1);
    return rows.length > 0;
  }

  return false;
};

export default {
  validatepresentation,
  canAccessChildpresentation,
  canEditChildpresentation,
  normalizeCategoryOrdering,
  normalizeDisplayOrder,
  STATUS_VALUES,
};
