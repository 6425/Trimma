import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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
