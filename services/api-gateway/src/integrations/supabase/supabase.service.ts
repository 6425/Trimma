import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

type Database = any;

@Injectable()
export class SupabaseService {
  private client: ReturnType<typeof createClient<Database>>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    this.client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  getClient(): ReturnType<typeof createClient<Database>> {
    return this.client;
  }
}
