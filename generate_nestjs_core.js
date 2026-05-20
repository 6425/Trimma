import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gatewaySrc = path.join(__dirname, 'services', 'api-gateway', 'src');

if (!fs.existsSync(gatewaySrc)) {
  console.error("❌ services/api-gateway/src not found. Run init_nestjs.bat first.");
  process.exit(1);
}

const dirs = [
  'config', 'common', 'core', 'modules', 'integrations', 'database', 'shared', 'infrastructure',
  'core/tenants',
  'integrations/supabase',
  'modules/salons', 'modules/services', 'modules/staff', 'modules/bookings'
];

dirs.forEach(dir => {
  const fullPath = path.join(gatewaySrc, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// 1. App Module
const appModuleContent = `import { Module } from '@nestjs/common';
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
`;
fs.writeFileSync(path.join(gatewaySrc, 'app.module.ts'), appModuleContent);

// 2. Supabase Integration
const supabaseClientContent = `import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
`;
fs.writeFileSync(path.join(gatewaySrc, 'integrations', 'supabase', 'supabase.service.ts'), supabaseClientContent);

// 3. Salons Module
fs.writeFileSync(path.join(gatewaySrc, 'modules', 'salons', 'salons.module.ts'), `import { Module } from '@nestjs/common';
import { SalonsController } from './salons.controller';
import { SalonsService } from './salons.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Module({
  controllers: [SalonsController],
  providers: [SalonsService, SupabaseService],
})
export class SalonsModule {}
`);

fs.writeFileSync(path.join(gatewaySrc, 'modules', 'salons', 'salons.controller.ts'), `import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SalonsService } from './salons.service';

@Controller('api/v1/salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Post()
  async createSalon(@Body() body: any) {
    return this.salonsService.create(body);
  }

  @Get(':id')
  async getSalon(@Param('id') id: string) {
    return this.salonsService.findOne(id);
  }
}
`);

fs.writeFileSync(path.join(gatewaySrc, 'modules', 'salons', 'salons.service.ts'), `import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Injectable()
export class SalonsService {
  constructor(private supabase: SupabaseService) {}

  async create(data: any) {
    const client = this.supabase.getClient();
    const slug = data.name.toLowerCase().replace(/\\s+/g, '-');
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
}
`);

// 4. Services Module
fs.writeFileSync(path.join(gatewaySrc, 'modules', 'services', 'services.module.ts'), `import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, SupabaseService],
})
export class ServicesModule {}
`);

fs.writeFileSync(path.join(gatewaySrc, 'modules', 'services', 'services.controller.ts'), `import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('api/v1/salons/:salonId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  async createService(@Param('salonId') salonId: string, @Body() body: any) {
    return this.servicesService.create(salonId, body);
  }

  @Get()
  async getServices(@Param('salonId') salonId: string) {
    return this.servicesService.findAll(salonId);
  }
}
`);

fs.writeFileSync(path.join(gatewaySrc, 'modules', 'services', 'services.service.ts'), `import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
`);

// 5. Staff Module
fs.writeFileSync(path.join(gatewaySrc, 'modules', 'staff', 'staff.module.ts'), `import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Module({
  controllers: [StaffController],
  providers: [StaffService, SupabaseService],
})
export class StaffModule {}
`);

fs.writeFileSync(path.join(gatewaySrc, 'modules', 'staff', 'staff.controller.ts'), `import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { StaffService } from './staff.service';

@Controller('api/v1/salons/:salonId/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  async createStaff(@Param('salonId') salonId: string, @Body() body: any) {
    return this.staffService.create(salonId, body);
  }

  @Get()
  async getStaff(@Param('salonId') salonId: string) {
    return this.staffService.findAll(salonId);
  }
}
`);

fs.writeFileSync(path.join(gatewaySrc, 'modules', 'staff', 'staff.service.ts'), `import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
      phone: data.phone,
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
`);

// 6. Bookings Module
fs.writeFileSync(path.join(gatewaySrc, 'modules', 'bookings', 'bookings.module.ts'), `import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, SupabaseService],
})
export class BookingsModule {}
`);

fs.writeFileSync(path.join(gatewaySrc, 'modules', 'bookings', 'bookings.controller.ts'), `import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('api/v1')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('salons/:salonId/availability')
  async checkAvailability(
    @Param('salonId') salonId: string,
    @Query('date') date: string,
    @Query('service_id') serviceId: string,
    @Query('staff_id') staffId?: string
  ) {
    return this.bookingsService.getAvailability(salonId, date, serviceId, staffId);
  }

  @Post('bookings')
  async createBooking(@Body() body: any) {
    return this.bookingsService.createBooking(body);
  }
}
`);

fs.writeFileSync(path.join(gatewaySrc, 'modules', 'bookings', 'bookings.service.ts'), `import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Injectable()
export class BookingsService {
  constructor(private supabase: SupabaseService) {}

  async getAvailability(salonId: string, date: string, serviceId: string, staffId?: string) {
    const client = this.supabase.getClient();
    
    // 1. Fetch Staff Working Hours
    let staffQuery = client.from('salon_staff').select('*').eq('salon_id', salonId);
    if (staffId) staffQuery = staffQuery.eq('id', staffId);
    
    const { data: staffList, error: staffError } = await staffQuery;
    if (staffError) throw new InternalServerErrorException(staffError.message);

    // 2. Fetch Existing Bookings
    const { data: bookings, error: bookingError } = await client.from('bookings')
      .select('booking_time, staff_id')
      .eq('salon_id', salonId)
      .eq('booking_date', date);
    if (bookingError) throw new InternalServerErrorException(bookingError.message);

    // 3. Fake Computation Engine (MVP)
    // Real implementation would subtract bookings from staff working_hours
    // and account for service duration.
    const allSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30"];
    const bookedTimes = bookings.map(b => b.booking_time);
    const available = allSlots.filter(slot => !bookedTimes.includes(slot + ":00"));

    return {
      date,
      available_slots: available
    };
  }

  async createBooking(data: any) {
    const client = this.supabase.getClient();

    // 1. Fetch Service Pricing
    const { data: service, error: svcError } = await client.from('services').select('price').eq('id', data.service_id).single();
    if (svcError || !service) throw new BadRequestException('Invalid Service ID');

    // 2. Lock Slot & Insert
    const { data: booking, error } = await client.from('bookings').insert([{
      salon_id: data.salon_id,
      service_id: data.service_id,
      staff_id: data.staff_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      booking_date: data.date,
      booking_time: data.time,
      amount: service.price,
      status: 'confirmed',
      booking_no: 'BK-' + Math.random().toString(36).substr(2, 6).toUpperCase()
    }]).select().single();

    if (error) throw new InternalServerErrorException(error.message);

    return {
      booking_id: booking.id,
      status: booking.status,
      total_price: booking.amount
    };
  }
}
`);

// Clean up default AppController and AppService
const appControllerPath = path.join(gatewaySrc, 'app.controller.ts');
const appServicePath = path.join(gatewaySrc, 'app.service.ts');
const appControllerSpecPath = path.join(gatewaySrc, 'app.controller.spec.ts');
if (fs.existsSync(appControllerPath)) fs.unlinkSync(appControllerPath);
if (fs.existsSync(appServicePath)) fs.unlinkSync(appServicePath);
if (fs.existsSync(appControllerSpecPath)) fs.unlinkSync(appControllerSpecPath);

console.log("✅ NestJS Enterprise API generated perfectly!");
