/* eslint-disable */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/auth');

// Lazy load supabase to avoid module loading errors
let supabase;
try {
  supabase = require('../../config/supabase');
  console.log('✅ Supabase config loaded in upload-url route, client:', !!supabase);
} catch (error) {
  console.error('❌ Failed to load Supabase config in upload-url:', error.message);
  supabase = null;
}

// Generate a signed upload URL for direct browser upload to Supabase Storage
router.post('/', authenticateToken, async (req, res) => {
  console.log('📤 [Upload-URL] POST / received (mounted at /upload-url)');
  console.log('🔍 Supabase client available:', !!supabase);
  console.log('🔍 Request body:', req.body);

  try {
    if (!supabase) {
      console.error('❌ Supabase not configured - client is null');
      console.error('Environment vars check:', {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing',
      });
      return res.status(500).json({
        error: 'Supabase not configured',
        details: 'Storage service unavailable',
      });
    }

    const { fileName, fileType, childId, classId } = req.body;
    console.log('📋 [Upload-URL] Request body:', { fileName, fileType, childId, classId });

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType required' });
    }

    // Generate unique file path: documents/{childId or classId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const storagePath = classId
      ? `class-${classId}/${timestamp}-${fileName}`
      : `child-${childId}/${timestamp}-${fileName}`;

    console.log('📁 Storage path:', storagePath);

    // Create a signed URL valid for 1 hour
    // Using service role key should bypass RLS
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error('Supabase upload URL error:', error);
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
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL', message: error.message });
  }
});

// Debug endpoint to verify route is loaded
router.get('/', (req, res) => {
  res.json({
    message: 'Upload URL route is accessible',
    supabaseConfigured: !!supabase,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
