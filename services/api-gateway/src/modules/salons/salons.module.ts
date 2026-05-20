import { Module } from '@nestjs/common';
import { SalonsController } from './salons.controller';
import { SalonsService } from './salons.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Module({
  controllers: [SalonsController],
  providers: [SalonsService, SupabaseService],
})
export class SalonsModule {}
