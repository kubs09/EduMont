/* eslint-disable */
const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const authenticateToken = require('../../middleware/auth');
const { canAccessDocumentByIds } = require('./validation');

const buildDocumentSelect = () => `
  SELECT
    d.id,
    d.title,
    d.description,
    d.file_url,
    d.file_name,
    d.mime_type,
    d.size_bytes,
    d.class_id,
    d.child_id,
    d.created_at,
    d.updated_at,
    c.name as class_name,
    ch.firstname as child_firstname,
    ch.surname as child_surname,
    creator.firstname as created_by_firstname,
    creator.surname as created_by_surname,
    updater.firstname as updated_by_firstname,
    updater.surname as updated_by_surname
  FROM documents d
  LEFT JOIN classes c ON d.class_id = c.id
  LEFT JOIN children ch ON d.child_id = ch.id
  LEFT JOIN users creator ON d.created_by = creator.id
  LEFT JOIN users updater ON d.updated_by = updater.id
`;

// Get all documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { class_id, child_id, created_by } = req.query;

    if (req.user.role === 'parent' && !class_id && !child_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const params = [];
    const conditions = [];

    if (class_id) {
      const classId = parseInt(class_id);
      if (Number.isNaN(classId)) {
        return res.status(400).json({ error: 'class_id must be a valid number' });
      }

      params.push(classId);
      conditions.push(`d.class_id = $${params.length}`);

      const canAccess = await canAccessDocumentByIds(
        req.user.id,
        req.user.role,
        null,
        classId
      );
      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (child_id) {
      const childId = parseInt(child_id);
      if (Number.isNaN(childId)) {
        return res.status(400).json({ error: 'child_id must be a valid number' });
      }

      params.push(childId);
      conditions.push(`d.child_id = $${params.length}`);

      const canAccess = await canAccessDocumentByIds(
        req.user.id,
        req.user.role,
        childId,
        null
      );
      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (created_by) {
      const createdBy = parseInt(created_by);
      if (Number.isNaN(createdBy)) {
        return res.status(400).json({ error: 'created_by must be a valid number' });
      }

      params.push(createdBy);
      conditions.push(`d.created_by = $${params.length}`);
    }

    let query = buildDocumentSelect();

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get documents for a specific child
router.get('/child/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;

    const canAccess = await canAccessDocumentByIds(
      req.user.id,
      req.user.role,
      parseInt(childId),
      null
    );
    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `${buildDocumentSelect()} WHERE d.child_id = $1 ORDER BY d.created_at DESC`;
    const result = await pool.query(query, [childId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching child documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get documents for a specific class
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;

    const canAccess = await canAccessDocumentByIds(
      req.user.id,
      req.user.role,
      null,
      parseInt(classId)
    );
    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `${buildDocumentSelect()} WHERE d.class_id = $1 ORDER BY d.created_at DESC`;
    const result = await pool.query(query, [classId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching class documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get a document by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const query = `${buildDocumentSelect()} WHERE d.id = $1`;
    const result = await pool.query(query, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];

    const canAccess = await canAccessDocumentByIds(
      req.user.id,
      req.user.role,
      document.child_id,
      document.class_id
    );
    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(document);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

module.exports = router;
