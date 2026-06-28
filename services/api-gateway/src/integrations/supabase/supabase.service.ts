import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

type Database = any;

@Injectable()
export class SupabaseService {
  private client: ReturnType<typeof createClient<Database>>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (process.env.TRIMMA_API_GATEWAY_ENABLED === 'true') {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when TRIMMA_API_GATEWAY_ENABLED=true.',
        );
      }
    }

    this.client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  getClient(): ReturnType<typeof createClient<Database>> {
    return this.client;
  }
}
