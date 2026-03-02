import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { TransactionType, TransactionStatus } from '@prediction-market/shared';

export interface WithdrawalFilters {
  userId: string;
  status?: TransactionStatus;
  page?: number;
  limit?: number;
}

export interface CreateTransactionInput {
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  metadata?: Record<string, unknown>;
  status?: TransactionStatus;
}

export interface TransactionFilters {
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(
    input: CreateTransactionInput,
    session?: ClientSession,
  ): Promise<TransactionDocument> {
    const transaction = new this.transactionModel({
      ...input,
      status: input.status || TransactionStatus.COMPLETED,
    });

    if (session) {
      return transaction.save({ session });
    }

    return transaction.save();
  }

  async findById(id: string): Promise<TransactionDocument | null> {
    try {
      return await this.transactionModel.findById(id);
    } catch {
      // Invalid ObjectId format - return null instead of throwing
      return null;
    }
  }

  async findByReference(reference: string): Promise<TransactionDocument | null> {
    return this.transactionModel.findOne({ reference });
  }

  async findByUser(filters: TransactionFilters) {
    const { userId, type, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (status) query.status = status;

    const [transactions, total] = await Promise.all([
      this.transactionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.transactionModel.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<TransactionDocument | null> {
    return this.transactionModel.findByIdAndUpdate(id, { status }, { new: true });
  }

  async checkIdempotency(transactionId: string): Promise<boolean> {
    try {
      const existing = await this.transactionModel.findOne({
        _id: transactionId,
        status: TransactionStatus.COMPLETED,
      });
      return !!existing;
    } catch {
      // Invalid ObjectId format - return false (not processed)
      return false;
    }
  }

  async findPendingByProvider(
    provider: string,
    maxAgeMinutes = 60,
  ): Promise<TransactionDocument[]> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    return this.transactionModel.find({
      status: TransactionStatus.PENDING,
      type: TransactionType.DEPOSIT,
      'metadata.provider': provider,
      createdAt: { $gte: cutoffTime },
    });
  }

  async markAsFailed(id: string, reason?: string): Promise<TransactionDocument | null> {
    return this.transactionModel.findByIdAndUpdate(
      id,
      {
        status: TransactionStatus.FAILED,
        'metadata.failureReason': reason,
      },
      { new: true },
    );
  }

  async updateMetadata(
    id: string,
    metadata: Record<string, unknown>,
  ): Promise<TransactionDocument | null> {
    const updateFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      updateFields[`metadata.${key}`] = value;
    }
    return this.transactionModel.findByIdAndUpdate(id, updateFields, { new: true });
  }

  async getSumPendingWithdrawals(userId: string): Promise<number> {
    const result = await this.transactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          type: TransactionType.WITHDRAWAL,
          status: {
            $in: [TransactionStatus.PENDING_APPROVAL, TransactionStatus.APPROVED],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    return result[0]?.total || 0;
  }

  async checkDuplicateWithdrawal(
    userId: string,
    amount: number,
    address: string,
    network: string,
  ): Promise<boolean> {
    const existing = await this.transactionModel.findOne({
      userId: new Types.ObjectId(userId),
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING_APPROVAL,
      amount,
      'metadata.address': address,
      'metadata.network': network,
    });
    return !!existing;
  }

  async findWithdrawalsByUser(filters: WithdrawalFilters) {
    const { userId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      type: TransactionType.WITHDRAWAL,
    };

    if (status) {
      query.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      this.transactionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.transactionModel.countDocuments(query),
    ]);

    return {
      withdrawals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateWithdrawalReview(
    id: string,
    data: {
      status: TransactionStatus;
      reviewedBy: string;
      reviewNotes?: string;
      rejectionReason?: string;
    },
  ): Promise<TransactionDocument | null> {
    return this.transactionModel.findByIdAndUpdate(
      id,
      {
        status: data.status,
        reviewedBy: new Types.ObjectId(data.reviewedBy),
        reviewedAt: new Date(),
        reviewNotes: data.reviewNotes,
        rejectionReason: data.rejectionReason,
      },
      { new: true },
    );
  }
}
