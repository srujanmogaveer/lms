import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env';

/**
 * Public Supabase client using Anon key (acts on behalf of unauthenticated or user sessions)
 */
export const supabasePublic: SupabaseClient = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Admin Supabase client using Service Role key (bypasses RLS for secure server-side ops)
 */
export const supabaseAdmin: SupabaseClient = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.serviceRoleKey || config.supabase.anonKey || 'placeholder-service-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Helper to check connection and configuration status
 */
export const checkSupabaseConnection = async (): Promise<{
  configured: boolean;
  status: 'connected' | 'unconfigured' | 'error';
  message: string;
}> => {
  if (!config.supabase.isConfigured) {
    return {
      configured: false,
      status: 'unconfigured',
      message: 'Supabase credentials are placeholder values. Provide active credentials in .env to connect live.',
    };
  }

  try {
    // Attempt a light ping against auth service
    const { error } = await supabasePublic.auth.getSession();
    if (error && !error.message.includes('Auth session missing')) {
      return {
        configured: true,
        status: 'error',
        message: error.message,
      };
    }
    return {
      configured: true,
      status: 'connected',
      message: 'Successfully connected to Supabase.',
    };
  } catch (err: any) {
    return {
      configured: true,
      status: 'error',
      message: err?.message || 'Failed to connect to Supabase',
    };
  }
};
