'use client';

import { useState, useEffect, useCallback } from 'react';
import { eventsApi, Event, EventFilters, PaginatedEvents, getErrorMessage } from '@/lib/api';

export function useEvents(initialFilters?: EventFilters) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const fetchEvents = useCallback(async (filters?: EventFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getAll(filters);
      setEvents(data.events);
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
    fetchEvents(initialFilters);
  }, [fetchEvents, initialFilters]);

  return {
    events,
    isLoading,
    error,
    pagination,
    refetch: fetchEvents,
  };
}

export function useFeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await eventsApi.getFeatured();
        setEvents(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return { events, isLoading, error };
}

export function useEvent(id: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getById(id);
      setEvent(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, fetchEvent]);

  return { event, isLoading, error, refetch: fetchEvent };
}

export function useCategories() {
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await eventsApi.getCategories();
        setCategories(data);
      } catch {
        // Silently fail for categories
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading };
}
