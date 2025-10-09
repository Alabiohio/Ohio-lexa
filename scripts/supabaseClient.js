import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Replace with your own values from Supabase → Project Settings → API
const SUPABASE_URL = "https://znqzjwlygjvqxmtfkdmg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucXpqd2x5Z2p2cXhtdGZrZG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzIzMzcsImV4cCI6MjA3MjI0ODMzN30.OMIMMBgl_1j6EIdvhfoCnlPP9VQF0c81lE0mcNnAgZE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
