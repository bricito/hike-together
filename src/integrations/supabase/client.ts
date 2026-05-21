import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof globalThis !== "undefined" && (globalThis as any).VITE_SUPABASE_URL)
) as string;

const SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof globalThis !== "undefined" && (globalThis as any).VITE_SUPABASE_ANON_KEY)
) as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
