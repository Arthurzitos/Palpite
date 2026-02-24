'use client';

import { create } from 'zustand';
import {
  adminApi,
  eventsApi,
  DashboardStats,
  Event,
  CreateEventData,
  UpdateEventData,
  ResolveEventData,
  getErrorMessage,
} from '@/lib/api';

interface AdminState {
  dashboardStats: DashboardStats | null;
  events: Event[];
  totalEvents: number;
  selectedEvent: Event | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchDashboard: () => Promise<void>;
  fetchEvents: (filters?: { status?: string; category?: string; search?: string; page?: number; limit?: number }) => Promise<void>;
  fetchEventById: (id: string) => Promise<Event>;
  createEvent: (data: CreateEventData) => Promise<Event>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<Event>;
  lockEvent: (id: string) => Promise<Event>;
  resolveEvent: (id: string, data: ResolveEventData) => Promise<Event>;
  cancelEvent: (id: string) => Promise<Event>;
  setSelectedEvent: (event: Event | null) => void;
  clearError: () => void;
}

export const useAdmin = create<AdminState>((set, get) => ({
  dashboardStats: null,
  events: [],
  totalEvents: 0,
  selectedEvent: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await adminApi.getDashboard();
      set({ dashboardStats: stats, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchEvents: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const result = await adminApi.getEvents(filters);
      set({
        events: result.events,
        totalEvents: result.total,
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  fetchEventById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventsApi.getById(id);
      set({ selectedEvent: event, isLoading: false });
      return event;
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  createEvent: async (data: CreateEventData) => {
    set({ isSubmitting: true, error: null });
    try {
      const event = await adminApi.createEvent(data);
      const { events } = get();
      set({ events: [event, ...events], isSubmitting: false });
      return event;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  updateEvent: async (id: string, data: UpdateEventData) => {
    set({ isSubmitting: true, error: null });
    try {
      const event = await adminApi.updateEvent(id, data);
      const { events } = get();
      set({
        events: events.map((e) => (e._id === id ? event : e)),
        selectedEvent: event,
        isSubmitting: false,
      });
      return event;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  lockEvent: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const event = await adminApi.lockEvent(id);
      const { events } = get();
      set({
        events: events.map((e) => (e._id === id ? event : e)),
        selectedEvent: event,
        isSubmitting: false,
      });
      return event;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  resolveEvent: async (id: string, data: ResolveEventData) => {
    set({ isSubmitting: true, error: null });
    try {
      const event = await adminApi.resolveEvent(id, data);
      const { events } = get();
      set({
        events: events.map((e) => (e._id === id ? event : e)),
        selectedEvent: event,
        isSubmitting: false,
      });
      return event;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  cancelEvent: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const event = await adminApi.cancelEvent(id);
      const { events } = get();
      set({
        events: events.map((e) => (e._id === id ? event : e)),
        selectedEvent: event,
        isSubmitting: false,
      });
      return event;
    } catch (error) {
      set({ error: getErrorMessage(error), isSubmitting: false });
      throw error;
    }
  },

  setSelectedEvent: (event: Event | null) => set({ selectedEvent: event }),

  clearError: () => set({ error: null }),
}));
