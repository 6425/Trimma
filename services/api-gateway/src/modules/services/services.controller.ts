import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Controller('api/v1/salons/:salonId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  async createService(
    @Param('salonId') salonId: string,
    @Body() body: CreateServiceDto,
  ): Promise<unknown> {
    return this.servicesService.create(salonId, body);
  }

  @Get()
  async getServices(@Param('salonId') salonId: string): Promise<unknown[]> {
    return this.servicesService.findAll(salonId);
  }
}
