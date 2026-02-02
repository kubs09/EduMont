/* eslint-disable */
const pool = require('../../config/database');
const { executeQuery } = require('../../utils/dbQuery');

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
  if (userRole === 'admin') return true;

  if (userRole === 'teacher') {
    if (classId) {
      const result = await pool.query(
        'SELECT 1 FROM class_teachers WHERE class_id = $1 AND teacher_id = $2',
        [classId, userId]
      );
      return result.rows.length > 0;
    }

    if (childId) {
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
  }

  if (userRole === 'parent') {
    if (childId) {
      const result = await pool.query('SELECT parent_id FROM children WHERE id = $1', [childId]);
      return result.rows.length > 0 && result.rows[0].parent_id === userId;
    }

    if (classId) {
      const result = await pool.query(
        `
        SELECT 1 FROM class_children cc
        JOIN children ch ON cc.child_id = ch.id
        WHERE cc.class_id = $1 AND ch.parent_id = $2
      `,
        [classId, userId]
      );
      return result.rows.length > 0;
    }
  }

  return false;
};

const canEditDocumentByIds = async (userId, userRole, childId, classId) => {
  if (userRole === 'admin') return true;

  if (userRole === 'teacher') {
    return canAccessDocumentByIds(userId, userRole, childId, classId);
  }

  return false;
};

const ensureChildInClass = async (childId, classId) => {
  if (!childId || !classId) return true;

  try {
    const result = await executeQuery(
      'SELECT 1 FROM class_children WHERE child_id = $1 AND class_id = $2',
      [childId, classId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking child in class:', error);
    // On error, assume not in class to prevent orphaned documents
    return false;
  }
};

module.exports = {
  validateDocument,
  canAccessDocumentByIds,
  canEditDocumentByIds,
  ensureChildInClass,
};
