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

  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Date is required and must be in YYYY-MM-DD format');
  }

  if (!data.start_time || !/^\d{2}:\d{2}$/.test(data.start_time)) {
    errors.push('Start time is required and must be in HH:MM format');
  }

  if (!data.duration_hours || !Number.isInteger(data.duration_hours)) {
    errors.push('Duration is required and must be a valid number');
  }

  if (data.duration_hours && (data.duration_hours < 1 || data.duration_hours > 3)) {
    errors.push('Duration must be between 1 and 3 hours');
  }

  if (data.activity && data.activity.length > 200) {
    errors.push('Activity must not exceed 200 characters');
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
