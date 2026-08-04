import { Router } from 'express';
const router = Router();
import { and, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '#backend/config/database.js';
import { children, classes, documents, users } from '#backend/db/schema.js';
import authenticateToken from '#backend/middleware/auth.js';
import console from 'console';
import validationModule from './validation.js';
const { canAccessDocumentByIds } = validationModule;

const creator = alias(users, 'creator');
const updater = alias(users, 'updater');

const documentSelection = {
  id: documents.id,
  title: documents.title,
  description: documents.description,
  file_url: documents.fileUrl,
  file_name: documents.fileName,
  mime_type: documents.mimeType,
  size_bytes: documents.sizeBytes,
  class_id: documents.classId,
  child_id: documents.childId,
  created_at: documents.createdAt,
  updated_at: documents.updatedAt,
  class_name: classes.name,
  child_firstname: children.firstname,
  child_surname: children.surname,
  created_by_firstname: creator.firstname,
  created_by_surname: creator.surname,
  updated_by_firstname: updater.firstname,
  updated_by_surname: updater.surname,
};

const buildDocumentQuery = () =>
  db
    .select(documentSelection)
    .from(documents)
    .leftJoin(classes, eq(documents.classId, classes.id))
    .leftJoin(children, eq(documents.childId, children.id))
    .leftJoin(creator, eq(documents.createdBy, creator.id))
    .leftJoin(updater, eq(documents.updatedBy, updater.id));

// Get all documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { class_id, child_id, created_by } = req.query;

    if (req.user.role === 'parent' && !class_id && !child_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conditions = [];

    if (class_id) {
      const classId = parseInt(class_id);
      if (Number.isNaN(classId)) {
        return res.status(400).json({ error: 'class_id must be a valid number' });
      }

      conditions.push(eq(documents.classId, classId));

      const canAccess = await canAccessDocumentByIds(req.user.id, req.user.role, null, classId);
      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (child_id) {
      const childId = parseInt(child_id);
      if (Number.isNaN(childId)) {
        return res.status(400).json({ error: 'child_id must be a valid number' });
      }

      conditions.push(eq(documents.childId, childId));

      const canAccess = await canAccessDocumentByIds(req.user.id, req.user.role, childId, null);
      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (created_by) {
      const createdBy = parseInt(created_by);
      if (Number.isNaN(createdBy)) {
        return res.status(400).json({ error: 'created_by must be a valid number' });
      }

      conditions.push(eq(documents.createdBy, createdBy));
    }

    let query = buildDocumentQuery();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(documents.createdAt));
    res.json(result);
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

    const result = await buildDocumentQuery()
      .where(eq(documents.childId, parseInt(childId)))
      .orderBy(desc(documents.createdAt));
    res.json(result);
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

    const result = await buildDocumentQuery()
      .where(eq(documents.classId, parseInt(classId)))
      .orderBy(desc(documents.createdAt));
    res.json(result);
  } catch (err) {
    console.error('Error fetching class documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get a document by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await buildDocumentQuery().where(eq(documents.id, parseInt(req.params.id)));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result[0];

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

export default router;
