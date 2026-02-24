import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionsService, TransactionFilters } from './transactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { TransactionType, TransactionStatus } from '@prediction-market/shared';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getMyTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters: TransactionFilters = {
      userId: user.userId,
      type,
      status,
      page: page || 1,
      limit: Math.min(limit || 20, 100),
    };

    return this.transactionsService.findByUser(filters);
  }
}
