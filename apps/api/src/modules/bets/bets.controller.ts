import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BetsService } from './bets.service';
import { CreateBetDto, BetFiltersDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('bets')
@UseGuards(JwtAuthGuard)
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  async create(@Body() createBetDto: CreateBetDto, @CurrentUser() user: AuthUser) {
    return this.betsService.create(createBetDto, user.userId);
  }

  @Get('my')
  async getMyBets(@Query() filters: BetFiltersDto, @CurrentUser() user: AuthUser) {
    return this.betsService.findByUser(user.userId, filters);
  }

  @Get('my/stats')
  async getMyStats(@CurrentUser() user: AuthUser) {
    return this.betsService.getUserStats(user.userId);
  }
}
