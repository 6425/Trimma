import { createClient } from '@supabase/supabase-js';

/**
 * Server-side only Supabase client.
 * Use this in Server Components and Route Handlers only — never in "use client" files.
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createClient(supabaseUrl, supabaseAnonKey);
}
