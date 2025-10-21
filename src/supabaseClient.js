import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://znqzjwlygjvqxmtfkdmg.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucXpqd2x5Z2p2cXhtdGZrZG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzIzMzcsImV4cCI6MjA3MjI0ODMzN30.OMIMMBgl_1j6EIdvhfoCnlPP9VQF0c81lE0mcNnAgZE";
export const supabase = createClient(supabaseUrl, supabaseKey);
