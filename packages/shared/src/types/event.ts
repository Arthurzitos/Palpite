import { EventCategory, EventStatus } from '../enums';

export interface Outcome {
  _id: string;
  label: string;
  totalPool: number;
  odds: number;
  color?: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: EventCategory;
  imageUrl?: string;
  status: EventStatus;
  outcomes: Outcome[];
  totalPool: number;
  resolvedOutcomeId?: string;
  resolutionSource?: string;
  startsAt?: Date;
  closesAt: Date;
  resolvedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventDto {
  title: string;
  description: string;
  category: EventCategory;
  imageUrl?: string;
  outcomes: CreateOutcomeDto[];
  startsAt?: Date;
  closesAt: Date;
}

export interface CreateOutcomeDto {
  label: string;
  color?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  category?: EventCategory;
  imageUrl?: string;
  startsAt?: Date;
  closesAt?: Date;
}

export interface ResolveEventDto {
  outcomeId: string;
  resolutionSource?: string;
}

export interface EventFilters {
  status?: EventStatus;
  category?: EventCategory;
  search?: string;
  page?: number;
  limit?: number;
}
