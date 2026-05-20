import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Module({
  controllers: [StaffController],
  providers: [StaffService, SupabaseService],
})
export class StaffModule {}
