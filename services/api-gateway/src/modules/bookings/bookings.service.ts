import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private supabase: SupabaseService) {}

  async getAvailability(
    salonId: string,
    date: string,
    serviceId: string,
    staffId?: string,
  ) {
    const client = this.supabase.getClient();

    // 1. Fetch Staff Working Hours
    let staffQuery = client
      .from('salon_staff')
      .select('*')
      .eq('salon_id', salonId);
    if (staffId) staffQuery = staffQuery.eq('id', staffId);

    const { error: staffError } = await staffQuery;
    if (staffError) throw new InternalServerErrorException(staffError.message);

    // 2. Fetch Existing Bookings
    const { data: bookings, error: bookingError } = await client
      .from('bookings')
      .select('booking_time, staff_id')
      .eq('salon_id', salonId)
      .eq('booking_date', date);
    if (bookingError)
      throw new InternalServerErrorException(bookingError.message);

    const validBookings = bookings as unknown as Array<{
      booking_time: string;
      staff_id: string;
    }>;

    // 3. Fake Computation Engine (MVP)
    // Real implementation would subtract bookings from staff working_hours
    // and account for service duration.
    const allSlots = [
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '14:00',
      '14:30',
    ];
    const bookedTimes = validBookings.map((b) => b.booking_time);
    const available = allSlots.filter(
      (slot) => !bookedTimes.includes(slot + ':00'),
    );

    return {
      date,
      available_slots: available,
    };
  }

  async createBooking(data: CreateBookingDto): Promise<unknown> {
    const client = this.supabase.getClient();

    // 1. Fetch Service Pricing
    const { data: service, error: svcError } = await client
      .from('services')
      .select('price')
      .eq('id', data.service_id)
      .single();
    if (svcError || !service)
      throw new BadRequestException('Invalid Service ID');

    const svc = service;

    // 2. Lock Slot & Insert
    const { data: booking, error } = (await client
      .from('bookings')
      .insert([
        {
          salon_id: data.salon_id,
          service_id: data.service_id,
          staff_id: data.staff_id,
          customer_email: data.customer_email,
          booking_date: data.date,
          booking_time: data.time,
          amount: svc.price,
          status: 'confirmed',
          payment_status: 'unpaid',
          booking_no:
            'BK-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        },
      ])
      .select()
      .single()) as { data: unknown; error: { message: string } | null };

    if (error) throw new InternalServerErrorException(error.message);

    const createdBooking = booking as {
      id: string;
      status: string;
      amount: number;
    };

    return {
      booking_id: createdBooking.id,
      status: createdBooking.status,
      total_price: createdBooking.amount,
    };
  }

  async getBookingsBySalon(salonId: string): Promise<unknown[]> {
    const client = this.supabase.getClient();
    const { data, error } = (await client
      .from('bookings')
      .select('*')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false })) as {
      data: unknown[];
      error: { message: string } | null;
    };

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
