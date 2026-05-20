import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Injectable()
export class StaffService {
  constructor(private supabase: SupabaseService) {}

  async create(salonId: string, data: any) {
    const client = this.supabase.getClient();
    const { data: staff, error } = await client.from('salon_staff').insert([{
      salon_id: salonId,
      name: data.name,
      role: data.role,
      email: data.email,
      working_hours: data.working_hours,
      status: 'active'
    }]).select().single();

    if (error) throw new InternalServerErrorException(error.message);
    return staff;
  }

  async findAll(salonId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client.from('salon_staff').select('*').eq('salon_id', salonId);
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
