import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, SupabaseService],
})
export class BookingsModule {}
