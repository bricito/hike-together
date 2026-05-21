import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zyxeupstiihvrzelbgwi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eGV1cHN0aWlodnJ6ZWxiZ3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjAzNzIsImV4cCI6MjA5MzczNjM3Mn0.MHgbyK3oO6z15eCfqX0Blhgm8DGi4TN60EaW8NCl-CY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
