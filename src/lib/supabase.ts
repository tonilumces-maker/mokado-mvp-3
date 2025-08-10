
import { createClient } from '@supabase/supabase-js'
import { demoClient, seedDemo } from './supabase-mock'

const isDemo = (import.meta.env.VITE_DEMO === 'true') 
  || !import.meta.env.VITE_SUPABASE_URL 
  || !import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = isDemo
  ? (seedDemo(), (demoClient as any))
  : createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    )
