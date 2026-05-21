import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
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

  @Get('salons/:salonId/bookings')
  async getBookingsBySalon(@Param('salonId') salonId: string) {
    return this.bookingsService.getBookingsBySalon(salonId);
  }

  @Post('bookings')
  async createBooking(@Body() body: any) {
    return this.bookingsService.createBooking(body);
  }
}
