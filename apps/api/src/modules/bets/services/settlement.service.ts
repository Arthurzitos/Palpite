import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventsService } from '../../events/events.service';
import { BetsService } from '../bets.service';
import { OddsService } from '../../events/services/odds.service';
import { UsersService } from '../../users/users.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { RakeService } from '../../rake/rake.service';
import { ResolveEventDto } from '../../events/dto';
import { BetStatus, TransactionType, EventStatus } from '@prediction-market/shared';
import { EventDocument } from '../../events/schemas/event.schema';

export interface SettlementResult {
  eventId: string;
  winningOutcomeId: string;
  totalPool: number;
  platformFee: number;
  distributablePool: number;
  winnersCount: number;
  losersCount: number;
  totalPaidOut: number;
  refundedCount: number;
}

@Injectable()
export class SettlementService {
  private readonly platformFeePercent: number;

  constructor(
    @InjectConnection() private connection: Connection,
    private configService: ConfigService,
    private eventsService: EventsService,
    private betsService: BetsService,
    private oddsService: OddsService,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
    private rakeService: RakeService,
  ) {
    this.platformFeePercent = this.configService.get<number>('PLATFORM_FEE_PERCENT') || 3;
  }

  async resolveEvent(
    eventId: string,
    resolveDto: ResolveEventDto,
  ): Promise<SettlementResult> {
    const event = await this.eventsService.findById(eventId);

    if (event.status !== EventStatus.OPEN && event.status !== EventStatus.LOCKED) {
      throw new ConflictException('Event cannot be resolved in current state');
    }

    const winningOutcome = event.outcomes.find(
      (o) => o._id.toString() === resolveDto.outcomeId,
    );

    if (!winningOutcome) {
      throw new BadRequestException('Invalid winning outcome ID');
    }

    // Check edge cases
    const bets = await this.betsService.findByEvent(eventId);

    if (bets.length === 0) {
      // No bets placed, just mark as resolved
      await this.eventsService.markAsResolved(eventId, resolveDto);
      return {
        eventId,
        winningOutcomeId: resolveDto.outcomeId,
        totalPool: 0,
        platformFee: 0,
        distributablePool: 0,
        winnersCount: 0,
        losersCount: 0,
        totalPaidOut: 0,
        refundedCount: 0,
      };
    }

    // Check if anyone bet on the winner
    const winningBets = bets.filter(
      (b) => b.outcomeId.toString() === resolveDto.outcomeId,
    );
    const losingBets = bets.filter(
      (b) => b.outcomeId.toString() !== resolveDto.outcomeId,
    );

    // Edge case: No one bet on the winner - refund everyone
    if (winningBets.length === 0 || winningOutcome.totalPool === 0) {
      return this.refundAllBets(event, bets, resolveDto);
    }

    // Edge case: Only one outcome has bets - refund
    const outcomesWithBets = event.outcomes.filter((o) => o.totalPool > 0);
    if (outcomesWithBets.length <= 1) {
      return this.refundAllBets(event, bets, resolveDto);
    }

    // Normal settlement
    return this.settleNormally(event, winningBets, losingBets, resolveDto);
  }

  private async settleNormally(
    event: EventDocument,
    winningBets: Awaited<ReturnType<typeof this.betsService.findByEvent>>,
    losingBets: Awaited<ReturnType<typeof this.betsService.findByEvent>>,
    resolveDto: ResolveEventDto,
  ): Promise<SettlementResult> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const totalPool = event.totalPool;
      const platformFee = this.oddsService.calculatePlatformFee(
        totalPool,
        this.platformFeePercent,
      );
      const distributablePool = this.oddsService.calculateDistributablePool(
        totalPool,
        this.platformFeePercent,
      );

      const winnerPool = event.outcomes.find(
        (o) => o._id.toString() === resolveDto.outcomeId,
      )!.totalPool;

      let totalPaidOut = 0;

      // Pay winners
      for (const bet of winningBets) {
        const payout = this.oddsService.calculateSettlementPayout(
          bet.amount,
          winnerPool,
          distributablePool,
        );

        // Update bet status
        await this.betsService.updateBetStatus(
          bet._id.toString(),
          BetStatus.WON,
          payout,
          session,
        );

        // Credit user balance
        const user = await this.usersService.findById(bet.userId.toString());
        const newBalance = user.balance + payout;

        await this.usersService.updateBalance(bet.userId.toString(), payout, 'add');

        // Create payout transaction
        await this.transactionsService.create(
          {
            userId: bet.userId.toString(),
            type: TransactionType.PAYOUT,
            amount: payout,
            balanceBefore: user.balance,
            balanceAfter: newBalance,
            reference: bet._id.toString(),
            metadata: {
              eventId: event._id.toString(),
              outcomeId: resolveDto.outcomeId,
            },
          },
          session,
        );

        // Update user stats
        await this.usersService.incrementStats(bet.userId.toString(), 'totalWon', payout);

        totalPaidOut += payout;
      }

      // Mark losers
      for (const bet of losingBets) {
        await this.betsService.updateBetStatus(
          bet._id.toString(),
          BetStatus.LOST,
          0,
          session,
        );
      }

      // Record platform rake
      if (platformFee > 0) {
        await this.rakeService.recordRake(
          {
            eventId: event._id.toString(),
            amount: platformFee,
            poolTotal: totalPool,
            rakePercent: this.platformFeePercent,
          },
          session,
        );
      }

      // Mark event as resolved
      await this.eventsService.markAsResolved(event._id.toString(), resolveDto);

      await session.commitTransaction();

      return {
        eventId: event._id.toString(),
        winningOutcomeId: resolveDto.outcomeId,
        totalPool,
        platformFee,
        distributablePool,
        winnersCount: winningBets.length,
        losersCount: losingBets.length,
        totalPaidOut: Math.round(totalPaidOut * 100) / 100,
        refundedCount: 0,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async refundAllBets(
    event: EventDocument,
    bets: Awaited<ReturnType<typeof this.betsService.findByEvent>>,
    resolveDto: ResolveEventDto,
  ): Promise<SettlementResult> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      let totalRefunded = 0;

      for (const bet of bets) {
        // Update bet status to refunded
        await this.betsService.updateBetStatus(
          bet._id.toString(),
          BetStatus.REFUNDED,
          bet.amount,
          session,
        );

        // Credit user balance
        const user = await this.usersService.findById(bet.userId.toString());
        const newBalance = user.balance + bet.amount;

        await this.usersService.updateBalance(bet.userId.toString(), bet.amount, 'add');

        // Create refund transaction
        await this.transactionsService.create(
          {
            userId: bet.userId.toString(),
            type: TransactionType.REFUND,
            amount: bet.amount,
            balanceBefore: user.balance,
            balanceAfter: newBalance,
            reference: bet._id.toString(),
            metadata: {
              eventId: event._id.toString(),
              reason: 'no_winner_bets',
            },
          },
          session,
        );

        totalRefunded += bet.amount;
      }

      // Mark event as resolved
      await this.eventsService.markAsResolved(event._id.toString(), resolveDto);

      await session.commitTransaction();

      return {
        eventId: event._id.toString(),
        winningOutcomeId: resolveDto.outcomeId,
        totalPool: event.totalPool,
        platformFee: 0,
        distributablePool: 0,
        winnersCount: 0,
        losersCount: 0,
        totalPaidOut: 0,
        refundedCount: bets.length,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelEvent(eventId: string): Promise<SettlementResult> {
    const event = await this.eventsService.findById(eventId);

    if (event.status === EventStatus.RESOLVED || event.status === EventStatus.CANCELLED) {
      throw new ConflictException('Event is already resolved or cancelled');
    }

    const bets = await this.betsService.findByEvent(eventId);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Refund all bets
      for (const bet of bets) {
        await this.betsService.updateBetStatus(
          bet._id.toString(),
          BetStatus.REFUNDED,
          bet.amount,
          session,
        );

        const user = await this.usersService.findById(bet.userId.toString());
        const newBalance = user.balance + bet.amount;

        await this.usersService.updateBalance(bet.userId.toString(), bet.amount, 'add');

        await this.transactionsService.create(
          {
            userId: bet.userId.toString(),
            type: TransactionType.REFUND,
            amount: bet.amount,
            balanceBefore: user.balance,
            balanceAfter: newBalance,
            reference: bet._id.toString(),
            metadata: {
              eventId: event._id.toString(),
              reason: 'event_cancelled',
            },
          },
          session,
        );
      }

      // Cancel event
      await this.eventsService.cancelEvent(eventId);

      await session.commitTransaction();

      return {
        eventId: event._id.toString(),
        winningOutcomeId: '',
        totalPool: event.totalPool,
        platformFee: 0,
        distributablePool: 0,
        winnersCount: 0,
        losersCount: 0,
        totalPaidOut: 0,
        refundedCount: bets.length,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
