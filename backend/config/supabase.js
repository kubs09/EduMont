/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured');
}

const supabase = supabaseUrl ? createClient(supabaseUrl) : null;

module.exports = supabase;
