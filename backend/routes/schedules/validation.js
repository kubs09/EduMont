/* eslint-disable */
const pool = require('../../config/database');

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

  if (data.status && !['not started', 'in progress', 'done'].includes(data.status)) {
    errors.push('Status must be "not started", "in progress", or "done"');
  }

  if (data.notes && data.notes.length > 1000) {
    errors.push('Notes must not exceed 1000 characters');
  }

  return errors;
};

const canAccessChildSchedule = async (userId, userRole, childId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'parent') {
    const result = await pool.query('SELECT parent_id FROM children WHERE id = $1', [childId]);
    return result.rows.length > 0 && result.rows[0].parent_id === userId;
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

module.exports = { validateSchedule, canAccessChildSchedule, canEditChildSchedule };
