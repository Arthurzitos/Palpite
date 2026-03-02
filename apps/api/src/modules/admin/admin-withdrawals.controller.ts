import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@prediction-market/shared';
import { AdminWithdrawalsService } from './admin-withdrawals.service';
import {
  AdminWithdrawalFiltersDto,
  ApproveWithdrawalDto,
  RejectWithdrawalDto,
} from './dto';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminWithdrawalsController {
  constructor(private readonly adminWithdrawalsService: AdminWithdrawalsService) {}

  @Get()
  async findAll(@Query() filters: AdminWithdrawalFiltersDto) {
    return this.adminWithdrawalsService.findAll(filters);
  }

  @Get('stats')
  async getStats() {
    return this.adminWithdrawalsService.getStats();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.adminWithdrawalsService.findById(id);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveWithdrawalDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.adminWithdrawalsService.approve(id, admin.userId, dto.notes);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectWithdrawalDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.adminWithdrawalsService.reject(id, admin.userId, dto.reason, dto.notes);
  }
}
