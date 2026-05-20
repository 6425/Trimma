import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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
