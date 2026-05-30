import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@Controller('api/v1/salons/:salonId/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  async createStaff(
    @Param('salonId') salonId: string,
    @Body() body: CreateStaffDto,
  ): Promise<unknown> {
    return this.staffService.create(salonId, body);
  }

  @Get()
  async getStaff(@Param('salonId') salonId: string): Promise<unknown[]> {
    return this.staffService.findAll(salonId);
  }
}
