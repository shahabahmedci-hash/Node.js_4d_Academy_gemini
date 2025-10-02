// src/lib/db.js
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '../config/supabase.js';

// ----------------------------------------------------------------------
// 1. Client for standard user actions (uses JWT/Anon Key)
// ----------------------------------------------------------------------
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------------------------------------------------------------
// 2. Client for Server-Side Admin actions (uses Service Role Key)
// WARNING: This key is highly powerful and must ONLY be used in secure Hopweb server routes!
// ----------------------------------------------------------------------
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        // Prevents the client from trying to store a session, as it's a static admin key
        persistSession: false
    }
});
