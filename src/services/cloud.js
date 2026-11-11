import { createClient } from '@supabase/supabase-js';

// Only public anon/publishable key belongs in the browser. Never use the service_role key here.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloudEnabled = Boolean(url && key);
export const supabase = cloudEnabled ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
