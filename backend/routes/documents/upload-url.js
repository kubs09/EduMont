import { Router } from 'express';
const router = Router();
import authenticateToken from '#backend/middleware/auth.js';

let supabase;
try {
  supabase = (await import('#backend/config/supabase.js')).default;
} catch (error) {
  supabase = null;
}

router.post('/', authenticateToken, async (req, res) => {
  if (supabase === null) {
    try {
      supabase = (await import('#backend/config/supabase.js')).default;
    } catch (error) {
      supabase = null;
    }
  }
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Supabase not configured',
        details: 'Storage service unavailable',
      });
    }

    const { fileName, fileType, childId, classId } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType required' });
    }

    if (!childId && !classId) {
      return res.status(400).json({ error: 'Either childId or classId must be provided' });
    }

    const timestamp = Date.now();

    const sanitizedFileName = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    const baseName = sanitizedFileName.replace(/\.[^.]+$/, '');
    if (!baseName || /^[-. ]+$/.test(baseName)) {
      return res.status(400).json({ error: 'Invalid file name after sanitization' });
    }

    const storagePath = classId
      ? `class-${classId}/${timestamp}-${sanitizedFileName}`
      : `child-${childId}/${timestamp}-${sanitizedFileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (error) {
      return res.status(500).json({
        error: 'Failed to generate upload URL',
        details: error.message || JSON.stringify(error),
      });
    }

    res.json({
      uploadUrl: data.signedUrl,
      filePath: storagePath,
      token: data.token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate upload URL', message: error.message });
  }
});

router.get('/', (req, res) => {
  res.json({
    message: 'Upload URL route is accessible',
    supabaseConfigured: !!supabase,
    timestamp: new Date().toISOString(),
  });
});

export default router;
