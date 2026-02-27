'use client';

import { create } from 'zustand';
import { betsApi, getErrorMessage } from '@/lib/api';

export interface BetSlipItem {
  id: string;
  eventId: string;
  outcomeId: string;
  eventTitle: string;
  outcome: 'yes' | 'no';
  outcomeLabel: string;
  odds: number;
}

interface BetSlipState {
  items: BetSlipItem[];
  isPlacingBet: boolean;
  error: string | null;

  addItem: (item: BetSlipItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  placeBet: (amount: number) => Promise<boolean>;
  clearError: () => void;
}

export const useBetSlip = create<BetSlipState>((set, get) => ({
  items: [],
  isPlacingBet: false,
  error: null,

  addItem: (item) => {
    set((state) => {
      // Replace existing item for same event, or add new one
      const existingIndex = state.items.findIndex((i) => i.eventId === item.eventId);
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = item;
        return { items: newItems };
      }
      // For now, only allow one item at a time
      return { items: [item] };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  clearItems: () => {
    set({ items: [] });
  },

  placeBet: async (amount: number) => {
    const { items } = get();
    if (items.length === 0) return false;

    const item = items[0];
    set({ isPlacingBet: true, error: null });

    try {
      await betsApi.create({
        eventId: item.eventId,
        outcomeId: item.outcomeId,
        amount,
      });
      set({ items: [], isPlacingBet: false });
      return true;
    } catch (err) {
      set({
        error: getErrorMessage(err),
        isPlacingBet: false,
      });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
