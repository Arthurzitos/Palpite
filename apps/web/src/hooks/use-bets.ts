'use client';

import { useState, useEffect, useCallback } from 'react';
import { betsApi, Bet, BetFilters, BetStats, getErrorMessage } from '@/lib/api';

export function useMyBets(initialFilters?: BetFilters) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const fetchBets = useCallback(async (filters?: BetFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await betsApi.getMyBets(filters);
      setBets(data.bets);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBets(initialFilters);
  }, [fetchBets, initialFilters]);

  return {
    bets,
    isLoading,
    error,
    pagination,
    refetch: fetchBets,
  };
}

export function useMyStats() {
  const [stats, setStats] = useState<BetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await betsApi.getMyStats();
        setStats(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}

export function usePlaceBet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeBet = useCallback(async (eventId: string, outcomeId: string, amount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const bet = await betsApi.create({ eventId, outcomeId, amount });
      return bet;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { placeBet, isLoading, error, clearError: () => setError(null) };
}
