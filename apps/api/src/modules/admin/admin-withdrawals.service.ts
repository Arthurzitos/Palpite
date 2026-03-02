import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { BetsService } from '../bets/bets.service';
import { NowPaymentsService } from '../wallet/services/nowpayments.service';
import { EmailService } from '../email/email.service';
import { TransactionType, TransactionStatus } from '@prediction-market/shared';
import { AdminWithdrawalFiltersDto } from './dto';

export interface WithdrawalWithUser {
  _id: string;
  userId: string;
  user: {
    _id: string;
    email: string;
    username: string;
  };
  amount: number;
  address: string;
  network: string;
  status: string;
  userContext: {
    balance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    accountAgeDays: number;
    totalBets: number;
  };
  reviewedBy?: {
    _id: string;
    email: string;
  };
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalStats {
  pendingCount: number;
  pendingAmount: number;
  todayApproved: number;
  todayApprovedAmount: number;
  todayRejected: number;
  todayRejectedAmount: number;
}

@Injectable()
export class AdminWithdrawalsService {
  private readonly logger = new Logger(AdminWithdrawalsService.name);

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectConnection() private connection: Connection,
    private transactionsService: TransactionsService,
    private usersService: UsersService,
    private betsService: BetsService,
    private nowPaymentsService: NowPaymentsService,
    private emailService: EmailService,
  ) {}

  async findAll(filters: AdminWithdrawalFiltersDto) {
    const { status, search, dateFrom, dateTo, minAmount, maxAmount, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      type: TransactionType.WITHDRAWAL,
    };

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        (query.createdAt as Record<string, unknown>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        (query.createdAt as Record<string, unknown>).$lte = new Date(dateTo);
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined) {
        (query.amount as Record<string, unknown>).$gte = minAmount;
      }
      if (maxAmount !== undefined) {
        (query.amount as Record<string, unknown>).$lte = maxAmount;
      }
    }

    let userIds: Types.ObjectId[] | undefined;
    if (search) {
      const users = await this.usersService.searchByEmailOrUsername(search);
      userIds = users.map((u) => new Types.ObjectId(u._id.toString()));
      if (userIds.length === 0) {
        return {
          withdrawals: [],
          pagination: { total: 0, page, limit, pages: 0 },
          stats: await this.getStats(),
        };
      }
      query.userId = { $in: userIds };
    }

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email username')
        .populate('reviewedBy', 'email')
        .lean(),
      this.transactionModel.countDocuments(query),
    ]);

    const withdrawals = await Promise.all(
      transactions.map(async (tx) => this.enrichWithdrawal(tx)),
    );

    return {
      withdrawals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats: await this.getStats(),
    };
  }

  async findById(id: string): Promise<WithdrawalWithUser> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('userId', 'email username')
      .populate('reviewedBy', 'email')
      .lean();

    if (!transaction) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (transaction.type !== TransactionType.WITHDRAWAL) {
      throw new BadRequestException('Transaction is not a withdrawal');
    }

    return this.enrichWithdrawal(transaction);
  }

  async getStats(): Promise<WithdrawalStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingStats, todayApprovedStats, todayRejectedStats] = await Promise.all([
      this.transactionModel.aggregate([
        {
          $match: {
            type: TransactionType.WITHDRAWAL,
            status: TransactionStatus.PENDING_APPROVAL,
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
      this.transactionModel.aggregate([
        {
          $match: {
            type: TransactionType.WITHDRAWAL,
            status: { $in: [TransactionStatus.APPROVED, TransactionStatus.COMPLETED] },
            reviewedAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
      this.transactionModel.aggregate([
        {
          $match: {
            type: TransactionType.WITHDRAWAL,
            status: TransactionStatus.REJECTED,
            reviewedAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    return {
      pendingCount: pendingStats[0]?.count || 0,
      pendingAmount: pendingStats[0]?.amount || 0,
      todayApproved: todayApprovedStats[0]?.count || 0,
      todayApprovedAmount: todayApprovedStats[0]?.amount || 0,
      todayRejected: todayRejectedStats[0]?.count || 0,
      todayRejectedAmount: todayRejectedStats[0]?.amount || 0,
    };
  }

  async approve(id: string, adminId: string, notes?: string): Promise<WithdrawalWithUser> {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (transaction.type !== TransactionType.WITHDRAWAL) {
      throw new BadRequestException('Transaction is not a withdrawal');
    }

    if (transaction.status !== TransactionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Withdrawal cannot be approved. Current status: ${transaction.status}`,
      );
    }

    const user = await this.usersService.findById(transaction.userId.toString());

    if (user.balance < transaction.amount) {
      throw new BadRequestException(
        `User no longer has sufficient balance. Balance: $${user.balance.toFixed(2)}, Requested: $${transaction.amount.toFixed(2)}`,
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      transaction.status = TransactionStatus.APPROVED;
      transaction.reviewedBy = new Types.ObjectId(adminId);
      transaction.reviewedAt = new Date();
      transaction.reviewNotes = notes;
      await transaction.save({ session });

      await this.usersService.updateBalance(
        transaction.userId.toString(),
        transaction.amount,
        'subtract',
      );

      const metadata = transaction.metadata as Record<string, string>;
      const payoutResponse = await this.nowPaymentsService.createPayout(
        transaction.amount,
        metadata.address,
        metadata.network,
        transaction._id.toString(),
      );

      transaction.status = TransactionStatus.COMPLETED;
      (transaction.metadata as Record<string, unknown>).payoutId = payoutResponse.id;
      transaction.balanceAfter = user.balance - transaction.amount;
      await transaction.save({ session });

      await this.usersService.incrementStats(
        transaction.userId.toString(),
        'totalWithdrawn',
        transaction.amount,
      );

      await session.commitTransaction();

      this.logger.log(
        `Withdrawal approved: txId=${id}, admin=${adminId}, amount=${transaction.amount}`,
      );

      // Send email notification (non-blocking)
      this.emailService
        .sendWithdrawalApproved(user.email, transaction.amount)
        .catch((err) => this.logger.error(`Failed to send approval email: ${err}`));

      return this.findById(id);
    } catch (error) {
      await session.abortTransaction();

      transaction.status = TransactionStatus.FAILED;
      (transaction.metadata as Record<string, unknown>).failureReason =
        error instanceof Error ? error.message : 'Unknown error';
      await transaction.save();

      this.logger.error(`Withdrawal approval failed: txId=${id}, error=${error}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async reject(
    id: string,
    adminId: string,
    reason: string,
    notes?: string,
  ): Promise<WithdrawalWithUser> {
    const transaction = await this.transactionModel.findById(id);

    if (!transaction) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (transaction.type !== TransactionType.WITHDRAWAL) {
      throw new BadRequestException('Transaction is not a withdrawal');
    }

    if (transaction.status !== TransactionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Withdrawal cannot be rejected. Current status: ${transaction.status}`,
      );
    }

    const user = await this.usersService.findById(transaction.userId.toString());

    transaction.status = TransactionStatus.REJECTED;
    transaction.reviewedBy = new Types.ObjectId(adminId);
    transaction.reviewedAt = new Date();
    transaction.rejectionReason = reason;
    transaction.reviewNotes = notes;
    await transaction.save();

    this.logger.log(
      `Withdrawal rejected: txId=${id}, admin=${adminId}, reason=${reason}`,
    );

    // Send email notification (non-blocking)
    this.emailService
      .sendWithdrawalRejected(user.email, transaction.amount, reason)
      .catch((err) => this.logger.error(`Failed to send rejection email: ${err}`));

    return this.findById(id);
  }

  private async enrichWithdrawal(tx: Record<string, unknown>): Promise<WithdrawalWithUser> {
    const userId = (tx.userId as { _id: Types.ObjectId })._id?.toString() || tx.userId?.toString();
    const userContext = await this.getUserContext(userId);

    const user = tx.userId as { _id: Types.ObjectId; email: string; username: string };
    const reviewer = tx.reviewedBy as { _id: Types.ObjectId; email: string } | undefined;
    const metadata = tx.metadata as Record<string, string>;

    return {
      _id: (tx._id as Types.ObjectId).toString(),
      userId,
      user: {
        _id: user._id?.toString() || userId,
        email: user.email || '',
        username: user.username || '',
      },
      amount: tx.amount as number,
      address: metadata?.address || '',
      network: metadata?.network || '',
      status: tx.status as string,
      userContext,
      reviewedBy: reviewer
        ? {
            _id: reviewer._id?.toString(),
            email: reviewer.email,
          }
        : undefined,
      reviewedAt: tx.reviewedAt as Date | undefined,
      reviewNotes: tx.reviewNotes as string | undefined,
      rejectionReason: tx.rejectionReason as string | undefined,
      createdAt: tx.createdAt as Date,
      updatedAt: tx.updatedAt as Date,
    };
  }

  private async getUserContext(userId: string) {
    const user = await this.usersService.findById(userId);
    const betsResult = await this.betsService.findByUser(userId, { page: 1, limit: 1 });

    const accountCreated = new Date(user.createdAt);
    const now = new Date();
    const accountAgeDays = Math.floor(
      (now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      balance: user.balance,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn,
      accountAgeDays,
      totalBets: betsResult.pagination.total,
    };
  }
}
