/* eslint-disable */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/auth');

let supabase;
try {
  supabase = require('../../config/supabase');
} catch (error) {
  supabase = null;
}

router.post('/', authenticateToken, async (req, res) => {
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

    const timestamp = Date.now();
    const storagePath = classId
      ? `class-${classId}/${timestamp}-${fileName}`
      : `child-${childId}/${timestamp}-${fileName}`;

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

module.exports = router;
