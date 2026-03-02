'use client';

import { create } from 'zustand';
import {
  adminWithdrawalsApi,
  AdminWithdrawal,
  AdminWithdrawalStats,
  AdminWithdrawalFilters,
  getErrorMessage,
} from '@/lib/api';

interface AdminWithdrawalsState {
  withdrawals: AdminWithdrawal[];
  totalWithdrawals: number;
  totalPages: number;
  currentPage: number;
  selectedWithdrawal: AdminWithdrawal | null;
  stats: AdminWithdrawalStats | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchWithdrawals: (filters?: AdminWithdrawalFilters) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchById: (id: string) => Promise<AdminWithdrawal>;
  approve: (id: string, notes?: string) => Promise<AdminWithdrawal>;
  reject: (id: string, reason: string, notes?: string) => Promise<AdminWithdrawal>;
  setSelectedWithdrawal: (withdrawal: AdminWithdrawal | null) => void;
  clearError: () => void;
}

export const useAdminWithdrawals = create<AdminWithdrawalsState>((set, get) => ({
  withdrawals: [],
  totalWithdrawals: 0,
  totalPages: 0,
  currentPage: 1,
  selectedWithdrawal: null,
  stats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchWithdrawals: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const result = await adminWithdrawalsApi.getAll(filters);
      set({
        withdrawals: result.withdrawals,
        totalWithdrawals: result.pagination.total,
        totalPages: result.pagination.pages,
        currentPage: result.pagination.page,
        stats: result.stats,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await adminWithdrawalsApi.getStats();
      set({ stats });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  fetchById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const withdrawal = await adminWithdrawalsApi.getById(id);
      set({ selectedWithdrawal: withdrawal, isLoading: false });
      return withdrawal;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  approve: async (id: string, notes?: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const withdrawal = await adminWithdrawalsApi.approve(id, notes);
      const { withdrawals } = get();
      set({
        withdrawals: withdrawals.map((w) => (w._id === id ? withdrawal : w)),
        selectedWithdrawal: withdrawal,
        isSubmitting: false,
      });
      // Refresh stats
      get().fetchStats();
      return withdrawal;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  reject: async (id: string, reason: string, notes?: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const withdrawal = await adminWithdrawalsApi.reject(id, reason, notes);
      const { withdrawals } = get();
      set({
        withdrawals: withdrawals.map((w) => (w._id === id ? withdrawal : w)),
        selectedWithdrawal: withdrawal,
        isSubmitting: false,
      });
      // Refresh stats
      get().fetchStats();
      return withdrawal;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  setSelectedWithdrawal: (withdrawal: AdminWithdrawal | null) =>
    set({ selectedWithdrawal: withdrawal }),

  clearError: () => set({ error: null }),
}));
