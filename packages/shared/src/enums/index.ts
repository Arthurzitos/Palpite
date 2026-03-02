export enum EventCategory {
  SPORTS = 'sports',
  CRYPTO = 'crypto',
  POLITICS = 'politics',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

export enum EventStatus {
  OPEN = 'open',
  LOCKED = 'locked',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export enum BetStatus {
  ACTIVE = 'active',
  WON = 'won',
  LOST = 'lost',
  REFUNDED = 'refunded',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BET = 'bet',
  PAYOUT = 'payout',
  REFUND = 'refund',
  FEE = 'fee',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
