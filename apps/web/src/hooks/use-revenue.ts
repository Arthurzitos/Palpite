'use client';

import { create } from 'zustand';
import {
  revenueApi,
  RevenueStats,
  RakeByPeriod,
  RakeRecord,
  PaginatedRakeRecords,
  getErrorMessage,
} from '@/lib/api';

interface RevenueState {
  stats: RevenueStats | null;
  byPeriod: RakeByPeriod[];
  history: RakeRecord[];
  topEvents: RakeRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
  isLoading: boolean;
  isWithdrawing: boolean;
  error: string | null;

  fetchStats: () => Promise<void>;
  fetchByPeriod: (period?: 'day' | 'week' | 'month', limit?: number) => Promise<void>;
  fetchHistory: (page?: number, limit?: number, status?: string) => Promise<void>;
  fetchTopEvents: (limit?: number) => Promise<void>;
  withdrawRevenue: (amount: number, withdrawalAddress: string) => Promise<{ success: boolean; reference: string }>;
  clearError: () => void;
}

export const useRevenue = create<RevenueState>((set) => ({
  stats: null,
  byPeriod: [],
  history: [],
  topEvents: [],
  pagination: null,
  isLoading: false,
  isWithdrawing: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await revenueApi.getStats();
      set({ stats, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchByPeriod: async (period = 'day', limit = 30) => {
    set({ isLoading: true, error: null });
    try {
      const byPeriod = await revenueApi.getByPeriod(period, limit);
      set({ byPeriod, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchHistory: async (page = 1, limit = 20, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await revenueApi.getHistory(page, limit, status);
      set({
        history: result.records,
        pagination: result.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchTopEvents: async (limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const topEvents = await revenueApi.getTopEvents(limit);
      set({ topEvents, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  withdrawRevenue: async (amount: number, withdrawalAddress: string) => {
    set({ isWithdrawing: true, error: null });
    try {
      const result = await revenueApi.withdrawRevenue(amount, withdrawalAddress);
      set({ isWithdrawing: false });
      return result;
    } catch (error) {
      set({ error: getErrorMessage(error), isWithdrawing: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
