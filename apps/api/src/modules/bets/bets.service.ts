import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, FilterQuery, ClientSession } from 'mongoose';
import { Bet, BetDocument } from './schemas/bet.schema';
import { CreateBetDto, BetFiltersDto } from './dto';
import { EventsService } from '../events/events.service';
import { OddsService } from '../events/services/odds.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BetStatus, TransactionType, EventStatus } from '@prediction-market/shared';

export interface PaginatedBets {
  bets: BetDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BetStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  activeBets: number;
  winRate: number;
}

@Injectable()
export class BetsService {
  constructor(
    @InjectModel(Bet.name) private betModel: Model<Bet>,
    @InjectConnection() private connection: Connection,
    private eventsService: EventsService,
    private oddsService: OddsService,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
  ) {}

  async create(createBetDto: CreateBetDto, userId: string): Promise<BetDocument> {
    const { eventId, outcomeId, amount } = createBetDto;

    // Validate event and outcome
    const { event, outcome } = await this.eventsService.getOutcome(eventId, outcomeId);

    // Check if event is open and not expired
    if (event.status !== EventStatus.OPEN) {
      throw new ConflictException('Event is not open for betting');
    }

    if (new Date() >= event.closesAt) {
      throw new ConflictException('Betting has closed for this event');
    }

    // Start a session for atomic operations
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Get user and check balance
      const user = await this.usersService.findById(userId);
      if (user.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Deduct balance atomically
      const updatedUser = await this.usersService.updateBalance(userId, amount, 'subtract');
      if (!updatedUser) {
        throw new BadRequestException('Insufficient balance');
      }

      // Calculate current odds before the bet
      const currentOdds = this.oddsService.calculateOdds(
        event.totalPool + amount,
        outcome.totalPool + amount,
      );

      const potentialPayout = this.oddsService.calculatePotentialPayout(amount, currentOdds);

      // Create bet
      const bet = new this.betModel({
        userId: new Types.ObjectId(userId),
        eventId: new Types.ObjectId(eventId),
        outcomeId: new Types.ObjectId(outcomeId),
        amount,
        oddsAtPurchase: currentOdds,
        potentialPayout,
        status: BetStatus.ACTIVE,
      });

      await bet.save({ session });

      // Create transaction record
      await this.transactionsService.create(
        {
          userId,
          type: TransactionType.BET,
          amount: -amount,
          balanceBefore: user.balance,
          balanceAfter: updatedUser.balance,
          reference: bet._id.toString(),
          metadata: { eventId, outcomeId },
        },
        session,
      );

      // Update user stats
      await this.usersService.incrementStats(userId, 'totalWagered', amount);

      // Update event pool and recalculate odds
      await this.eventsService.addBetToOutcome(eventId, outcomeId, amount);

      await session.commitTransaction();

      return bet;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findByUser(userId: string, filters: BetFiltersDto): Promise<PaginatedBets> {
    const query: FilterQuery<Bet> = { userId: new Types.ObjectId(userId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.eventId) {
      query.eventId = new Types.ObjectId(filters.eventId);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [bets, total] = await Promise.all([
      this.betModel
        .find(query)
        .populate('eventId', 'title status outcomes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.betModel.countDocuments(query).exec(),
    ]);

    return {
      bets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserStats(userId: string): Promise<BetStats> {
    const stats = await this.betModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalWagered: { $sum: '$amount' },
          totalWon: {
            $sum: {
              $cond: [{ $eq: ['$status', BetStatus.WON] }, '$payout', 0],
            },
          },
          totalLost: {
            $sum: {
              $cond: [{ $eq: ['$status', BetStatus.LOST] }, '$amount', 0],
            },
          },
          activeBets: {
            $sum: {
              $cond: [{ $eq: ['$status', BetStatus.ACTIVE] }, 1, 0],
            },
          },
          wonBets: {
            $sum: {
              $cond: [{ $eq: ['$status', BetStatus.WON] }, 1, 0],
            },
          },
          settledBets: {
            $sum: {
              $cond: [
                { $in: ['$status', [BetStatus.WON, BetStatus.LOST]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        activeBets: 0,
        winRate: 0,
      };
    }

    const { totalBets, totalWagered, totalWon, totalLost, activeBets, wonBets, settledBets } =
      stats[0];

    return {
      totalBets,
      totalWagered: Math.round(totalWagered * 100) / 100,
      totalWon: Math.round(totalWon * 100) / 100,
      totalLost: Math.round(totalLost * 100) / 100,
      activeBets,
      winRate: settledBets > 0 ? Math.round((wonBets / settledBets) * 100) : 0,
    };
  }

  async findByEvent(eventId: string): Promise<BetDocument[]> {
    return this.betModel
      .find({ eventId: new Types.ObjectId(eventId), status: BetStatus.ACTIVE })
      .exec();
  }

  async findByEventAndOutcome(eventId: string, outcomeId: string): Promise<BetDocument[]> {
    return this.betModel
      .find({
        eventId: new Types.ObjectId(eventId),
        outcomeId: new Types.ObjectId(outcomeId),
        status: BetStatus.ACTIVE,
      })
      .exec();
  }

  async updateBetStatus(
    betId: string,
    status: BetStatus,
    payout: number,
    session?: ClientSession,
  ): Promise<BetDocument | null> {
    const update = {
      status,
      payout,
      settledAt: new Date(),
    };

    if (session) {
      return this.betModel.findByIdAndUpdate(betId, update, { new: true, session });
    }

    return this.betModel.findByIdAndUpdate(betId, update, { new: true });
  }

  async getActiveBetsForEvent(eventId: string) {
    return this.betModel.aggregate([
      { $match: { eventId: new Types.ObjectId(eventId), status: BetStatus.ACTIVE } },
      {
        $group: {
          _id: '$outcomeId',
          totalAmount: { $sum: '$amount' },
          betCount: { $sum: 1 },
        },
      },
    ]);
  }
}
