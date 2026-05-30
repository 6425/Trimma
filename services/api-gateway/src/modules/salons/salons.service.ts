import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { CreateSalonDto } from './dto/create-salon.dto';

@Injectable()
export class SalonsService {
  constructor(private supabase: SupabaseService) {}

  async create(data: CreateSalonDto): Promise<unknown> {
    const client = this.supabase.getClient();
    const slug = data.name.toLowerCase().replace(/\s+/g, '-');
    const { data: salon, error } = (await client
      .from('salons')
      .insert([
        {
          name: data.name,
          slug: slug,
          owner_email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.address,
          subscription_plan_id: null, // To be mapped
        },
      ])
      .select()
      .single()) as { data: unknown; error: { message: string } | null };

    if (error) throw new InternalServerErrorException(error.message);
    return salon;
  }

  async findOne(id: string): Promise<unknown> {
    const client = this.supabase.getClient();
    const { data, error } = (await client
      .from('salons')
      .select('*')
      .eq('id', id)
      .single()) as { data: unknown; error: { message: string } | null };
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findBySlug(slug: string): Promise<unknown> {
    const client = this.supabase.getClient();
    const { data, error } = (await client
      .from('salons')
      .select('*')
      .eq('slug', slug)
      .single()) as { data: unknown; error: { message: string } | null };
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
