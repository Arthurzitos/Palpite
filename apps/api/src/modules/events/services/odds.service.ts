import { Injectable } from '@nestjs/common';
import { Outcome } from '../schemas/event.schema';

@Injectable()
export class OddsService {
  /**
   * Calculate odds for a specific outcome using pari-mutuel model
   * Formula: Odds = Total Pool / Outcome Pool
   */
  calculateOdds(totalPool: number, outcomePool: number): number {
    if (outcomePool === 0) return 0;
    return Math.round((totalPool / outcomePool) * 100) / 100;
  }

  /**
   * Recalculate odds for all outcomes in an event
   */
  recalculateAllOdds(outcomes: Outcome[], totalPool: number): Outcome[] {
    return outcomes.map((outcome) => ({
      ...outcome,
      odds: this.calculateOdds(totalPool, outcome.totalPool),
    }));
  }

  /**
   * Calculate potential payout for a bet
   * This is an estimate based on current odds
   */
  calculatePotentialPayout(betAmount: number, currentOdds: number): number {
    if (currentOdds === 0) return betAmount;
    return Math.round(betAmount * currentOdds * 100) / 100;
  }

  /**
   * Calculate actual payout during settlement
   * Formula: (bet.amount / winnerPool) * distributablePool
   */
  calculateSettlementPayout(
    betAmount: number,
    winnerPool: number,
    distributablePool: number,
  ): number {
    if (winnerPool === 0) return 0;
    return Math.round((betAmount / winnerPool) * distributablePool * 100) / 100;
  }

  /**
   * Calculate platform fee
   */
  calculatePlatformFee(totalPool: number, feePercent: number): number {
    return Math.round(totalPool * (feePercent / 100) * 100) / 100;
  }

  /**
   * Calculate distributable pool after fee
   */
  calculateDistributablePool(totalPool: number, feePercent: number): number {
    const fee = this.calculatePlatformFee(totalPool, feePercent);
    return Math.round((totalPool - fee) * 100) / 100;
  }

  /**
   * Calculate implied probability from odds
   */
  calculateImpliedProbability(odds: number): number {
    if (odds === 0) return 0;
    return Math.round((1 / odds) * 100 * 100) / 100;
  }

  /**
   * Simulate new odds after a hypothetical bet
   */
  simulateOddsAfterBet(currentTotalPool: number, outcomePool: number, betAmount: number): number {
    const newTotalPool = currentTotalPool + betAmount;
    const newOutcomePool = outcomePool + betAmount;
    return this.calculateOdds(newTotalPool, newOutcomePool);
  }
}
