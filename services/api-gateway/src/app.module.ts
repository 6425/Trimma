import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SalonsModule } from './modules/salons/salons.module';
import { ServicesModule } from './modules/services/services.module';
import { StaffModule } from './modules/staff/staff.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { GatewayLockdownGuard } from './common/guards/gateway-lockdown.guard';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SalonsModule,
    ServicesModule,
    StaffModule,
    BookingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: GatewayLockdownGuard },
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
  ],
})
export class AppModule {}
