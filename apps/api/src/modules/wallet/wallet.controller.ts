import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser, CurrentUserPayload, Public } from '../../common/decorators';
import { WalletService } from './wallet.service';
import { DepositCryptoDto, DepositFiatDto, WithdrawDto } from './dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.getBalance(user.userId);
  }

  @Post('deposit/crypto')
  async depositCrypto(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: DepositCryptoDto,
  ) {
    return this.walletService.depositCrypto(user.userId, dto.amount);
  }

  @Post('deposit/fiat')
  async depositFiat(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: DepositFiatDto,
  ) {
    return this.walletService.depositFiat(user.userId, dto.amount);
  }

  @Post('withdraw')
  async withdraw(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: WithdrawDto,
  ) {
    return this.walletService.withdraw(
      user.userId,
      dto.amount,
      dto.address,
      dto.network,
    );
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactionHistory(
      user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @SkipThrottle()
  @Post('webhook/nowpayments')
  @HttpCode(HttpStatus.OK)
  async handleNowPaymentsWebhook(
    @Headers('x-nowpayments-sig') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    await this.walletService.handleNowPaymentsWebhook(body, signature);

    return { success: true };
  }
}
