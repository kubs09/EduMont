/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured');
  console.warn('  SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.warn('  SUPABASE_KEY:', supabaseKey ? 'set' : 'missing');
}

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

if (supabase) {
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️ Supabase client not initialized');
}

module.exports = supabase;
