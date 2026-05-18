import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL;
const anon = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SOURCES_BUCKET = process.env.REACT_APP_SOURCES_BUCKET || "hookify-sources";
export const RENDERS_BUCKET = process.env.REACT_APP_RENDERS_BUCKET || "hookify-renders";
