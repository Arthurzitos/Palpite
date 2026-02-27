'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: string[];
  toggleFavorite: (eventId: string) => void;
  isFavorite: (eventId: string) => boolean;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      toggleFavorite: (eventId: string) => {
        set((state) => {
          const isFav = state.favorites.includes(eventId);
          if (isFav) {
            return { favorites: state.favorites.filter((id) => id !== eventId) };
          }
          return { favorites: [...state.favorites, eventId] };
        });
      },

      isFavorite: (eventId: string) => {
        return get().favorites.includes(eventId);
      },
    }),
    {
      name: 'prediction-market-favorites',
    }
  )
);
