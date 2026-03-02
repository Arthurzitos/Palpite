'use client';

import { create } from 'zustand';
import {
  walletApi,
  WalletBalance,
  Transaction,
  DepositCryptoResult,
  DepositFiatResult,
  WithdrawResult,
  AvailableBalanceResult,
  getErrorMessage,
} from '@/lib/api';

interface WalletState {
  balance: WalletBalance | null;
  availableBalance: AvailableBalanceResult | null;
  transactions: Transaction[];
  pendingWithdrawals: Transaction[];
  totalTransactions: number;
  isLoading: boolean;
  isDepositing: boolean;
  isWithdrawing: boolean;
  isCancelling: boolean;
  error: string | null;

  fetchBalance: () => Promise<void>;
  fetchAvailableBalance: () => Promise<void>;
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  fetchPendingWithdrawals: () => Promise<void>;
  depositCrypto: (amount: number) => Promise<DepositCryptoResult>;
  depositFiat: (amount: number) => Promise<DepositFiatResult>;
  withdraw: (amount: number, address: string, network: string) => Promise<WithdrawResult>;
  cancelWithdrawal: (id: string) => Promise<void>;
  clearError: () => void;
  refreshWallet: () => Promise<void>;
}

export const useWallet = create<WalletState>((set, get) => ({
  balance: null,
  availableBalance: null,
  transactions: [],
  pendingWithdrawals: [],
  totalTransactions: 0,
  isLoading: false,
  isDepositing: false,
  isWithdrawing: false,
  isCancelling: false,
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

  fetchAvailableBalance: async () => {
    try {
      const availableBalance = await walletApi.getAvailableBalance();
      set({ availableBalance });
    } catch (error) {
      set({ error: getErrorMessage(error) });
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

  fetchPendingWithdrawals: async () => {
    try {
      const result = await walletApi.getWithdrawals('pending_approval', 1, 50);
      set({ pendingWithdrawals: result.withdrawals });
    } catch (error) {
      set({ error: getErrorMessage(error) });
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
      // Refresh balance and pending withdrawals after withdrawal
      get().fetchBalance();
      get().fetchAvailableBalance();
      get().fetchPendingWithdrawals();
      set({ isWithdrawing: false });
      return result;
    } catch (error) {
      set({ error: getErrorMessage(error), isWithdrawing: false });
      throw error;
    }
  },

  cancelWithdrawal: async (id: string) => {
    set({ isCancelling: true, error: null });
    try {
      await walletApi.cancelWithdrawal(id);
      // Refresh balance and pending withdrawals after cancellation
      get().fetchBalance();
      get().fetchAvailableBalance();
      get().fetchPendingWithdrawals();
      get().fetchTransactions();
      set({ isCancelling: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isCancelling: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  refreshWallet: async () => {
    const { fetchBalance, fetchAvailableBalance, fetchTransactions, fetchPendingWithdrawals } = get();
    await Promise.all([fetchBalance(), fetchAvailableBalance(), fetchTransactions(), fetchPendingWithdrawals()]);
  },
}));
