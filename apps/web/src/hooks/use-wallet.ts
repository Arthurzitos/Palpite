'use client';

import { create } from 'zustand';
import {
  walletApi,
  WalletBalance,
  Transaction,
  DepositCryptoResult,
  DepositFiatResult,
  WithdrawResult,
  getErrorMessage,
} from '@/lib/api';

interface WalletState {
  balance: WalletBalance | null;
  transactions: Transaction[];
  totalTransactions: number;
  isLoading: boolean;
  isDepositing: boolean;
  isWithdrawing: boolean;
  error: string | null;

  fetchBalance: () => Promise<void>;
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  depositCrypto: (amount: number) => Promise<DepositCryptoResult>;
  depositFiat: (amount: number) => Promise<DepositFiatResult>;
  withdraw: (amount: number, address: string, network: string) => Promise<WithdrawResult>;
  clearError: () => void;
  refreshWallet: () => Promise<void>;
}

export const useWallet = create<WalletState>((set, get) => ({
  balance: null,
  transactions: [],
  totalTransactions: 0,
  isLoading: false,
  isDepositing: false,
  isWithdrawing: false,
  error: null,

  fetchBalance: async () => {
    set({ isLoading: true, error: null });
    try {
      const balance = await walletApi.getBalance();
      set({ balance, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchTransactions: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const result = await walletApi.getTransactions(page, limit);
      set({
        transactions: result.transactions,
        totalTransactions: result.total,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  depositCrypto: async (amount: number) => {
    set({ isDepositing: true, error: null });
    try {
      const result = await walletApi.depositCrypto(amount);
      set({ isDepositing: false });
      return result;
    } catch (error) {
      set({ error: getErrorMessage(error), isDepositing: false });
      throw error;
    }
  },

  depositFiat: async (amount: number) => {
    set({ isDepositing: true, error: null });
    try {
      const result = await walletApi.depositFiat(amount);
      set({ isDepositing: false });
      return result;
    } catch (error) {
      set({ error: getErrorMessage(error), isDepositing: false });
      throw error;
    }
  },

  withdraw: async (amount: number, address: string, network: string) => {
    set({ isWithdrawing: true, error: null });
    try {
      const result = await walletApi.withdraw({ amount, address, network });
      // Refresh balance after withdrawal
      get().fetchBalance();
      set({ isWithdrawing: false });
      return result;
    } catch (error) {
      set({ error: getErrorMessage(error), isWithdrawing: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  refreshWallet: async () => {
    const { fetchBalance, fetchTransactions } = get();
    await Promise.all([fetchBalance(), fetchTransactions()]);
  },
}));
