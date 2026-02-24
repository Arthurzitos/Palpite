import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { RakeRecord, RakeRecordDocument, RakeStatus } from './schemas/rake-record.schema';
import { PlatformWallet, PlatformWalletDocument } from './schemas/platform-wallet.schema';
import { NowPaymentsService } from '../wallet/services/nowpayments.service';

export interface RakeStats {
  totalEarned: number;
  totalAvailable: number;
  totalWithdrawn: number;
  pendingWithdrawal: number;
  rakeRecordsCount: number;
  averageRakePerEvent: number;
}

export interface RakeByPeriod {
  period: string;
  amount: number;
  count: number;
}

export interface RecordRakeInput {
  eventId: string;
  amount: number;
  poolTotal: number;
  rakePercent: number;
}

@Injectable()
export class RakeService {
  constructor(
    @InjectModel(RakeRecord.name) private rakeRecordModel: Model<RakeRecordDocument>,
    @InjectModel(PlatformWallet.name) private platformWalletModel: Model<PlatformWalletDocument>,
    @InjectConnection() private connection: Connection,
    private configService: ConfigService,
    @Inject(forwardRef(() => NowPaymentsService))
    private nowPaymentsService: NowPaymentsService,
  ) {}

  async recordRake(input: RecordRakeInput, session?: ClientSession): Promise<RakeRecordDocument> {
    const rakeRecord = new this.rakeRecordModel({
      eventId: input.eventId,
      amount: input.amount,
      poolTotal: input.poolTotal,
      rakePercent: input.rakePercent,
      status: RakeStatus.AVAILABLE,
    });

    const savedRecord = session ? await rakeRecord.save({ session }) : await rakeRecord.save();

    await this.updatePlatformWallet(input.amount, session);

    return savedRecord;
  }

  private async updatePlatformWallet(amount: number, session?: ClientSession): Promise<void> {
    const options = session ? { session, upsert: true, new: true } : { upsert: true, new: true };

    await this.platformWalletModel.findOneAndUpdate(
      { walletId: 'main' },
      {
        $inc: {
          balance: amount,
          totalEarned: amount,
        },
      },
      options,
    );
  }

  async getStats(): Promise<RakeStats> {
    const wallet = await this.getOrCreatePlatformWallet();
    const rakeRecordsCount = await this.rakeRecordModel.countDocuments({
      status: RakeStatus.AVAILABLE,
    });

    const averageRakePerEvent =
      rakeRecordsCount > 0 ? wallet.totalEarned / rakeRecordsCount : 0;

    return {
      totalEarned: Math.round(wallet.totalEarned * 100) / 100,
      totalAvailable: Math.round(wallet.balance * 100) / 100,
      totalWithdrawn: Math.round(wallet.totalWithdrawn * 100) / 100,
      pendingWithdrawal: Math.round(wallet.pendingWithdrawal * 100) / 100,
      rakeRecordsCount,
      averageRakePerEvent: Math.round(averageRakePerEvent * 100) / 100,
    };
  }

  async getRakeByPeriod(period: 'day' | 'week' | 'month' = 'day', limit = 30): Promise<RakeByPeriod[]> {
    const groupFormat = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: {
        $dateToString: {
          format: '%Y-W%V',
          date: '$createdAt',
        },
      },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
    };

    const results = await this.rakeRecordModel.aggregate([
      {
        $group: {
          _id: groupFormat[period],
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: limit },
      {
        $project: {
          period: '$_id',
          amount: { $round: ['$amount', 2] },
          count: 1,
          _id: 0,
        },
      },
    ]);

    return results;
  }

  async getRakeHistory(
    filters: { page?: number; limit?: number; status?: RakeStatus } = {},
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filters.status) {
      query.status = filters.status;
    }

    const [records, total] = await Promise.all([
      this.rakeRecordModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('eventId', 'title category'),
      this.rakeRecordModel.countDocuments(query),
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTopEventsByRake(limit = 10) {
    const results = await this.rakeRecordModel
      .find()
      .sort({ amount: -1 })
      .limit(limit)
      .populate('eventId', 'title category totalPool');

    return results;
  }

  async withdrawRevenue(
    amount: number,
    withdrawalAddress: string,
    currency?: string,
  ): Promise<{ success: boolean; reference: string; payoutId: string }> {
    const wallet = await this.getOrCreatePlatformWallet();

    if (amount > wallet.balance) {
      throw new BadRequestException('Insufficient platform balance');
    }

    const minWithdrawal = this.configService.get<number>('MIN_RAKE_WITHDRAWAL') || 100;
    if (amount < minWithdrawal) {
      throw new BadRequestException(`Minimum withdrawal is $${minWithdrawal}`);
    }

    if (!this.nowPaymentsService.isPayoutConfigured()) {
      throw new BadRequestException('Payout service not configured. Set NOWPAYMENTS_EMAIL and NOWPAYMENTS_PASSWORD.');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const reference = `RAKE-WD-${Date.now()}-${withdrawalAddress.slice(0, 8)}`;

      // Create payout via NOWPayments
      const payout = await this.nowPaymentsService.createPayout(
        amount,
        withdrawalAddress,
        currency,
        reference,
      );

      await this.platformWalletModel.findOneAndUpdate(
        { walletId: 'main', balance: { $gte: amount } },
        {
          $inc: {
            balance: -amount,
            totalWithdrawn: amount,
          },
        },
        { session },
      );

      await this.rakeRecordModel.updateMany(
        { status: RakeStatus.AVAILABLE },
        {
          $set: {
            status: RakeStatus.WITHDRAWN,
            withdrawnAt: new Date(),
            withdrawalReference: reference,
            payoutId: payout.id,
          },
        },
        { session },
      );

      await session.commitTransaction();

      return {
        success: true,
        reference,
        payoutId: payout.id,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getNowPaymentsBalance(): Promise<{ currency: string; amount: number }[]> {
    if (!this.nowPaymentsService.isPayoutConfigured()) {
      throw new BadRequestException('Payout service not configured');
    }
    return this.nowPaymentsService.getAccountBalance();
  }

  async getRakeByEvent(eventId: string): Promise<RakeRecordDocument | null> {
    return this.rakeRecordModel.findOne({ eventId }).populate('eventId', 'title category');
  }

  private async getOrCreatePlatformWallet(): Promise<PlatformWalletDocument> {
    let wallet = await this.platformWalletModel.findOne({ walletId: 'main' });

    if (!wallet) {
      wallet = await this.platformWalletModel.create({
        walletId: 'main',
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        pendingWithdrawal: 0,
      });
    }

    return wallet;
  }
}
