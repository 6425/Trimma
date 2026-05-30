import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('api/v1')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('salons/:salonId/availability')
  async checkAvailability(
    @Param('salonId') salonId: string,
    @Query('date') date: string,
    @Query('service_id') serviceId: string,
    @Query('staff_id') staffId?: string,
  ): Promise<unknown> {
    return this.bookingsService.getAvailability(
      salonId,
      date,
      serviceId,
      staffId,
    );
  }

  @Get('salons/:salonId/bookings')
  async getBookingsBySalon(
    @Param('salonId') salonId: string,
  ): Promise<unknown[]> {
    return this.bookingsService.getBookingsBySalon(salonId);
  }

  @Post('bookings')
  async createBooking(@Body() body: CreateBookingDto): Promise<unknown> {
    return this.bookingsService.createBooking(body);
  }
}
