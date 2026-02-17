/* eslint-disable */
const pool = require('../../config/database');

const STATUS_VALUES = [
  'prerequisites not met',
  'to be presented',
  'presented',
  'practiced',
  'mastered',
];

const PRESENTED_STATUSES = new Set(['presented', 'practiced', 'mastered']);

const validateSchedule = (data) => {
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

const normalizeCategoryOrdering = async (client, childId, category) => {
  if (!category) return;

  const result = await client.query(
    `
    SELECT id, status, display_order
    FROM schedules
    WHERE child_id = $1 AND category = $2
    ORDER BY display_order ASC, id ASC
  `,
    [childId, category]
  );

  if (result.rows.length === 0) return;

  const firstNotPresentedIndex = result.rows.findIndex(
    (row) => !PRESENTED_STATUSES.has(row.status)
  );

  if (firstNotPresentedIndex === -1) return;

  const updates = [];

  result.rows.forEach((row, index) => {
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
    await client.query(
      `
      UPDATE schedules
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [update.status, update.id]
    );
  }
};

const canAccessChildSchedule = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'parent') {
    const result = await pool.query(
      'SELECT 1 FROM child_parents WHERE child_id = $1 AND parent_id = $2',
      [childId, userId]
    );
    return result.rows.length > 0;
  }

  if (userRole === 'teacher') {
    const result = await pool.query(
      `
      SELECT 1 FROM class_teachers ct
      JOIN class_children cc ON ct.class_id = cc.class_id
      WHERE ct.teacher_id = $1 AND cc.child_id = $2
    `,
      [userId, childId]
    );
    return result.rows.length > 0;
  }

  return false;
};

const canEditChildSchedule = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'teacher') {
    const result = await pool.query(
      `
      SELECT 1 FROM class_teachers ct
      JOIN class_children cc ON ct.class_id = cc.class_id
      WHERE ct.teacher_id = $1 AND cc.child_id = $2
    `,
      [userId, childId]
    );
    return result.rows.length > 0;
  }

  return false;
};

module.exports = {
  validateSchedule,
  canAccessChildSchedule,
  canEditChildSchedule,
  normalizeCategoryOrdering,
  STATUS_VALUES,
};
