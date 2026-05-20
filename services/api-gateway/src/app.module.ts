import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SalonsModule } from './modules/salons/salons.module';
import { ServicesModule } from './modules/services/services.module';
import { StaffModule } from './modules/staff/staff.module';
import { BookingsModule } from './modules/bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SalonsModule,
    ServicesModule,
    StaffModule,
    BookingsModule,
  ],
})
export class AppModule {}
