import { TransactionType, TransactionStatus } from '../enums';

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  metadata?: Record<string, unknown>;
  status: TransactionStatus;
  createdAt: Date;
}

export interface CreateTransactionDto {
  userId: string;
  type: TransactionType;
  amount: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  page?: number;
  limit?: number;
}

export interface WalletBalance {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export interface DepositRequest {
  amount: number;
}

export interface WithdrawRequest {
  amount: number;
  address: string;
  network: string;
}
