import { checkSupabaseConnection } from '../config/supabase';
import { config } from '../config/env';

export class SupabaseService {
  /**
   * Diagnostic service check for Supabase connectivity and setup
   */
  public async getStatus() {
    const connectionStatus = await checkSupabaseConnection();

    return {
      environment: config.nodeEnv,
      supabase: {
        configured: connectionStatus.configured,
        status: connectionStatus.status,
        message: connectionStatus.message,
        url: config.supabase.url ? config.supabase.url.replace(/\/\/[^@]+@/, '//***@') : null,
      },
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}

export const supabaseService = new SupabaseService();
