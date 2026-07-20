import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { CreateServiceDto } from './dto/create-service.dto';

/** Keep in sync with apps/web/src/lib/service-pricing.ts */
const MIN_SERVICE_PRICE_LKR = 700;
const MIN_SERVICE_FEE_MESSAGE = `Minimum service fee is LKR ${MIN_SERVICE_PRICE_LKR.toFixed(2)}`;

@Injectable()
export class ServicesService {
  constructor(private supabase: SupabaseService) {}

  async create(salonId: string, data: CreateServiceDto): Promise<unknown> {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < MIN_SERVICE_PRICE_LKR) {
      throw new BadRequestException(MIN_SERVICE_FEE_MESSAGE);
    }

    const client = this.supabase.getClient();
    const { data: service, error } = (await client
      .from('services')
      .insert([
        {
          salon_id: salonId,
          name: data.name,
          price: data.price,
          duration_min: data.duration_minutes,
          category: data.category,
          status: data.is_active ? 'active' : 'inactive',
        },
      ])
      .select()
      .single()) as { data: unknown; error: { message: string } | null };

    if (error) throw new InternalServerErrorException(error.message);
    return service;
  }

  async findAll(salonId: string): Promise<unknown[]> {
    const client = this.supabase.getClient();
    const { data, error } = (await client
      .from('services')
      .select('*')
      .eq('salon_id', salonId)
      .eq('status', 'active')) as {
      data: unknown[];
      error: { message: string } | null;
    };
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
