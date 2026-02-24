import { BetStatus } from '../enums';

export interface Bet {
  _id: string;
  userId: string;
  eventId: string;
  outcomeId: string;
  amount: number;
  oddsAtPurchase: number;
  potentialPayout: number;
  status: BetStatus;
  payout: number;
  createdAt: Date;
  settledAt?: Date;
}

export interface CreateBetDto {
  eventId: string;
  outcomeId: string;
  amount: number;
}

export interface BetWithEvent extends Bet {
  event: {
    _id: string;
    title: string;
    status: string;
    outcomes: Array<{
      _id: string;
      label: string;
    }>;
  };
}

export interface BetFilters {
  status?: BetStatus;
  eventId?: string;
  page?: number;
  limit?: number;
}

export interface BetStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  activeBets: number;
  winRate: number;
}
