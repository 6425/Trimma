import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
      customer_email: data.customer_email,
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
