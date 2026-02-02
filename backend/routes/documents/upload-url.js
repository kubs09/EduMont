/* eslint-disable */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/auth');
const supabase = require('../../config/supabase');

// Generate a signed upload URL for direct browser upload to Supabase Storage
router.post('/upload-url', authenticateToken, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { fileName, fileType, childId, classId } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType required' });
    }

    // Generate unique file path: documents/{childId or classId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const storagePath = classId
      ? `documents/class-${classId}/${timestamp}-${fileName}`
      : `documents/child-${childId}/${timestamp}-${fileName}`;

    // Create a signed URL valid for 1 hour
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(storagePath, 3600);

    if (error) {
      console.error('Supabase upload URL error:', error);
      return res
        .status(500)
        .json({ error: 'Failed to generate upload URL', details: error.message });
    }

    res.json({
      uploadUrl: data.signedUrl,
      filePath: storagePath,
      token: data.token,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL', message: error.message });
  }
});

module.exports = router;
