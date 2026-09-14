import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// null when the env vars aren't configured (e.g. local dev without Supabase
// set up, or test environments) — useRealtimeChannel treats a null client as
// "realtime disabled, fall back to polling only".
export const realtimeClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
