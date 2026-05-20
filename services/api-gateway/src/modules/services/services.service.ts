import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Injectable()
export class ServicesService {
  constructor(private supabase: SupabaseService) {}

  async create(salonId: string, data: any) {
    const client = this.supabase.getClient();
    const { data: service, error } = await client.from('services').insert([{
      salon_id: salonId,
      name: data.name,
      price: data.price,
      duration_min: data.duration_minutes,
      category: data.category,
      status: data.is_active ? 'active' : 'inactive'
    }]).select().single();

    if (error) throw new InternalServerErrorException(error.message);
    return service;
  }

  async findAll(salonId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client.from('services').select('*').eq('salon_id', salonId).eq('status', 'active');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
