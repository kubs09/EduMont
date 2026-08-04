import { Router } from 'express';
const router = Router();
import { eq } from 'drizzle-orm';
import { db } from '#backend/config/database.js';
import { documents } from '#backend/db/schema.js';
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
  try {
    const { id } = req.params;

    const documentResult = await db
      .select()
      .from(documents)
      .where(eq(documents.id, parseInt(id)))
      .limit(1);
    if (documentResult.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documentResult[0];

    const canEdit = await canEditDocumentByIds(
      req.user.id,
      req.user.role,
      document.childId,
      document.classId
    );
    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let storagePath = null;
    if (supabase && document.fileUrl) {
      storagePath = extractStoragePath(document.fileUrl);
    }

    await db.delete(documents).where(eq(documents.id, parseInt(id)));

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
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
