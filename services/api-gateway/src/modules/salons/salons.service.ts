import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Injectable()
export class SalonsService {
  constructor(private supabase: SupabaseService) {}

  async create(data: any) {
    const client = this.supabase.getClient();
    const slug = data.name.toLowerCase().replace(/\s+/g, '-');
    const { data: salon, error } = await client.from('salons').insert([{
      name: data.name,
      slug: slug,
      owner_email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.address,
      subscription_plan_id: null // To be mapped
    }]).select().single();

    if (error) throw new InternalServerErrorException(error.message);
    return salon;
  }

  async findOne(id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client.from('salons').select('*').eq('id', id).single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findBySlug(slug: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client.from('salons').select('*').eq('slug', slug).single();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
