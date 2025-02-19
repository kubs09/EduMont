/* eslint-disable */
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

const documentsService = {
  async saveDocument(file, userId, stepId, documentType, description = null) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `INSERT INTO documents 
         (original_name, file_path, mime_type, file_size, user_id, document_type, admission_step_id, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          userId,
          documentType,
          stepId,
          description,
        ]
      );
      return rows[0].id;
    } finally {
      client.release();
    }
  },

  async getDocuments(userId, stepId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM documents 
         WHERE user_id = $1 AND admission_step_id = $2
         ORDER BY upload_date DESC`,
        [userId, stepId]
      );
      return rows;
    } finally {
      client.release();
    }
  },

  async deleteDocument(documentId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        'SELECT file_path FROM documents WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [documentId, userId]
      );

      if (rows.length === 0) {
        throw new Error('Document not found or unauthorized');
      }

      if (rows[0].file_path) {
        try {
          // Use stat to check if file exists instead of existsSync
          await fs.stat(rows[0].file_path);
          await fs.unlink(rows[0].file_path);
        } catch (err) {
          // Ignore errors if file doesn't exist
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }
      }

      await client.query('DELETE FROM documents WHERE id = $1', [documentId]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteAllDocumentsForStep(userId, stepId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get all documents for this step
      const { rows } = await client.query(
        'SELECT file_path FROM documents WHERE user_id = $1 AND admission_step_id = $2 FOR UPDATE',
        [userId, stepId]
      );

      // Delete physical files
      for (const doc of rows) {
        if (doc.file_path) {
          try {
            // Use stat to check if file exists instead of existsSync
            await fs.stat(doc.file_path);
            await fs.unlink(doc.file_path);
          } catch (err) {
            // Ignore errors if file doesn't exist
            if (err.code !== 'ENOENT') {
              throw err;
            }
          }
        }
      }

      // Delete all document records
      await client.query('DELETE FROM documents WHERE user_id = $1 AND admission_step_id = $2', [
        userId,
        stepId,
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = documentsService;
