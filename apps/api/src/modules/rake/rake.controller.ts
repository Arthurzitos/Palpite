import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RakeService } from './rake.service';
import { WithdrawRevenueDto, RakeFiltersDto, RakeByPeriodDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '@prediction-market/shared';

@Controller('admin/revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RakeController {
  constructor(private readonly rakeService: RakeService) {}

  @Get('stats')
  async getStats() {
    return this.rakeService.getStats();
  }

  @Get('by-period')
  async getByPeriod(@Query() query: RakeByPeriodDto) {
    return this.rakeService.getRakeByPeriod(query.period, query.limit);
  }

  @Get('history')
  async getHistory(@Query() filters: RakeFiltersDto) {
    return this.rakeService.getRakeHistory(filters);
  }

  @Get('top-events')
  async getTopEvents(@Query('limit') limit?: number) {
    return this.rakeService.getTopEventsByRake(limit || 10);
  }

  @Get('event/:eventId')
  async getByEvent(@Param('eventId') eventId: string) {
    return this.rakeService.getRakeByEvent(eventId);
  }

  @Post('withdraw')
  async withdrawRevenue(@Body() withdrawDto: WithdrawRevenueDto) {
    return this.rakeService.withdrawRevenue(
      withdrawDto.amount,
      withdrawDto.withdrawalAddress,
      withdrawDto.currency,
    );
  }

  @Get('nowpayments-balance')
  async getNowPaymentsBalance() {
    return this.rakeService.getNowPaymentsBalance();
  }
}
