'use client';

import { create } from 'zustand';
import {
  adminUsersApi,
  AdminUser,
  UserStats,
  UserFilters,
  AdjustBalanceData,
  PaginatedBets,
  getErrorMessage,
} from '@/lib/api';

interface AdminUsersState {
  users: AdminUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  selectedUser: AdminUser | null;
  userBets: PaginatedBets | null;
  stats: UserStats | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchUsers: (filters?: UserFilters) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  fetchUserById: (id: string) => Promise<AdminUser>;
  fetchUserBets: (id: string, page?: number, limit?: number) => Promise<void>;
  updateUserRole: (id: string, role: string) => Promise<AdminUser>;
  adjustUserBalance: (id: string, data: AdjustBalanceData) => Promise<AdminUser>;
  setSelectedUser: (user: AdminUser | null) => void;
  clearError: () => void;
}

export const useAdminUsers = create<AdminUsersState>((set, get) => ({
  users: [],
  totalUsers: 0,
  totalPages: 0,
  currentPage: 1,
  selectedUser: null,
  userBets: null,
  stats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchUsers: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const result = await adminUsersApi.getAll(filters);
      set({
        users: result.users,
        totalUsers: result.total,
        totalPages: result.totalPages,
        currentPage: result.page,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchUserStats: async () => {
    try {
      const stats = await adminUsersApi.getStats();
      set({ stats });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await adminUsersApi.getById(id);
      set({ selectedUser: user, isLoading: false });
      return user;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  fetchUserBets: async (id: string, page = 1, limit = 20) => {
    try {
      const bets = await adminUsersApi.getBets(id, page, limit);
      set({ userBets: bets });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },

  updateUserRole: async (id: string, role: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const user = await adminUsersApi.updateRole(id, role);
      const { users } = get();
      set({
        users: users.map((u) => (u._id === id ? user : u)),
        selectedUser: user,
        isSubmitting: false,
      });
      return user;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  adjustUserBalance: async (id: string, data: AdjustBalanceData) => {
    set({ isSubmitting: true, error: null });
    try {
      const user = await adminUsersApi.adjustBalance(id, data);
      const { users } = get();
      set({
        users: users.map((u) => (u._id === id ? user : u)),
        selectedUser: user,
        isSubmitting: false,
      });
      return user;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  setSelectedUser: (user: AdminUser | null) => set({ selectedUser: user }),

  clearError: () => set({ error: null }),
}));
