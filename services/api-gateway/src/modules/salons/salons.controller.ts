import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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

  @Get('slug/:slug')
  async getSalonBySlug(@Param('slug') slug: string) {
    return this.salonsService.findBySlug(slug);
  }
}
