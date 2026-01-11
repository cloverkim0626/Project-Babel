
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase Environment Variables. DB features will not work.')
}

// Fallback to avoid white-screen crash if env vars are missing
const isValid = supabaseUrl && supabaseAnonKey;

if (!isValid) {
    console.error('Supabase credentials missing! Check .env file.');
}

export const supabase = isValid
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        }
    })
    : createClient('https://placeholder.supabase.co', 'placeholder');
