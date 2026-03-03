import { Router } from 'express';
const router = Router();
import pool from '#backend/config/database.js';
import authenticateToken from '#backend/middleware/auth.js';
import console from 'console';
import validation from './validation.js';
const { canEditDocumentByIds } = validation;

let supabase;
try {
  supabase = (await import('#backend/config/supabase.js')).default;
} catch (error) {
  supabase = null;
}

const extractStoragePath = (fileUrl) => {
  try {
    if (!fileUrl) return null;
    const urlWithoutQuery = fileUrl.split('?')[0];
    const match = urlWithoutQuery.match(/\/documents\/(.+)$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting storage path:', error);
    return null;
  }
};

router.delete('/:id', authenticateToken, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { id } = req.params;

    await client.query('BEGIN');

    const documentResult = await client.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (documentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documentResult.rows[0];

    const canEdit = await canEditDocumentByIds(
      req.user.id,
      req.user.role,
      document.child_id,
      document.class_id
    );
    if (!canEdit) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    let storagePath = null;
    if (supabase && document.file_url) {
      storagePath = extractStoragePath(document.file_url);
    }

    await client.query('DELETE FROM documents WHERE id = $1', [id]);

    await client.query('COMMIT');

    if (storagePath) {
      try {
        const { error: deleteError } = await supabase.storage
          .from('documents')
          .remove([storagePath]);

        if (deleteError) {
          console.warn('Warning: Failed to delete file from storage:', deleteError);
        }
      } catch (storageErr) {
        console.warn('Warning: Storage deletion error:', storageErr);
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  } finally {
    client?.release();
  }
});

export default router;
