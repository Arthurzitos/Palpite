import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data as {
            accessToken: string;
            refreshToken: string;
          };

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    if (apiError?.message) {
      return Array.isArray(apiError.message) ? apiError.message[0] : apiError.message;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Events API
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
  category: string;
  imageUrl?: string;
  status: string;
  outcomes: Outcome[];
  totalPool: number;
  resolvedOutcomeId?: string;
  resolutionSource?: string;
  startsAt?: string;
  closesAt: string;
  resolvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEvents {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SortFilter = 'live' | 'trending' | 'popular' | 'new';

export interface EventFilters {
  status?: string;
  category?: string;
  search?: string;
  filter?: SortFilter;
  page?: number;
  limit?: number;
}

export const eventsApi = {
  getAll: async (filters?: EventFilters): Promise<PaginatedEvents> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.filter) params.append('filter', filters.filter);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/events?${params.toString()}`);
    return response.data;
  },

  getFeatured: async (): Promise<Event[]> => {
    const response = await api.get('/events/featured');
    return response.data;
  },

  getById: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getCategories: async (): Promise<{ category: string; count: number }[]> => {
    const response = await api.get('/events/categories');
    return response.data;
  },
};

// Bets API
export interface Bet {
  _id: string;
  userId: string;
  eventId: string | Event;
  outcomeId: string;
  amount: number;
  oddsAtPurchase: number;
  potentialPayout: number;
  status: string;
  payout: number;
  createdAt: string;
  settledAt?: string;
}

export interface PaginatedBets {
  bets: Bet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BetStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  activeBets: number;
  winRate: number;
}

export interface BetFilters {
  status?: string;
  eventId?: string;
  page?: number;
  limit?: number;
}

export const betsApi = {
  create: async (data: { eventId: string; outcomeId: string; amount: number }): Promise<Bet> => {
    const response = await api.post('/bets', data);
    return response.data;
  },

  getMyBets: async (filters?: BetFilters): Promise<PaginatedBets> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.eventId) params.append('eventId', filters.eventId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/bets/my?${params.toString()}`);
    return response.data;
  },

  getMyStats: async (): Promise<BetStats> => {
    const response = await api.get('/bets/my/stats');
    return response.data;
  },
};

// Wallet API
export interface WalletBalance {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export interface DepositCryptoResult {
  checkoutUrl: string;
  orderId: string;
  transactionId: string;
}

export interface DepositFiatResult {
  invoiceUrl: string;
  invoiceId: string;
  transactionId: string;
  widgetConfig?: {
    api_key: string;
    invoice_id: string;
    order_id: string;
    price_amount: string;
    price_currency: string;
    pay_currency: string;
  };
}

export interface WithdrawResult {
  transactionId: string;
  recordId: string;
  status: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'payout' | 'refund' | 'fee';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  metadata?: Record<string, unknown>;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const walletApi = {
  getBalance: async (): Promise<WalletBalance> => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  depositCrypto: async (amount: number): Promise<DepositCryptoResult> => {
    const response = await api.post('/wallet/deposit/crypto', { amount });
    return response.data;
  },

  depositFiat: async (amount: number): Promise<DepositFiatResult> => {
    const response = await api.post('/wallet/deposit/fiat', { amount });
    return response.data;
  },

  withdraw: async (data: { amount: number; address: string; network: string }): Promise<WithdrawResult> => {
    const response = await api.post('/wallet/withdraw', data);
    return response.data;
  },

  getTransactions: async (page = 1, limit = 20): Promise<PaginatedTransactions> => {
    const response = await api.get(`/wallet/transactions?page=${page}&limit=${limit}`);
    return response.data;
  },
};

// Admin API
export interface DashboardStats {
  totalEvents: number;
  openEvents: number;
  resolvedEvents: number;
  totalVolume: number;
  totalUsers: number;
  totalBets: number;
}

export interface CreateEventData {
  title: string;
  description: string;
  category: string;
  outcomes: { label: string; color?: string }[];
  closesAt: string;
  startsAt?: string;
  imageUrl?: string;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  closesAt?: string;
  startsAt?: string;
}

export interface ResolveEventData {
  outcomeId: string;
  resolutionSource?: string;
}

export const adminApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getEvents: async (filters?: EventFilters): Promise<PaginatedEvents> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/admin/events?${params.toString()}`);
    return response.data;
  },

  createEvent: async (data: CreateEventData): Promise<Event> => {
    const response = await api.post('/admin/events', data);
    return response.data;
  },

  updateEvent: async (id: string, data: UpdateEventData): Promise<Event> => {
    const response = await api.patch(`/admin/events/${id}`, data);
    return response.data;
  },

  lockEvent: async (id: string): Promise<Event> => {
    const response = await api.post(`/admin/events/${id}/lock`);
    return response.data;
  },

  resolveEvent: async (id: string, data: ResolveEventData): Promise<Event> => {
    const response = await api.post(`/admin/events/${id}/resolve`, data);
    return response.data;
  },

  cancelEvent: async (id: string): Promise<Event> => {
    const response = await api.post(`/admin/events/${id}/cancel`);
    return response.data;
  },
};

// Revenue/Rake API
export interface RevenueStats {
  totalEarned: number;
  totalAvailable: number;
  totalWithdrawn: number;
  pendingWithdrawal: number;
  rakeRecordsCount: number;
  averageRakePerEvent: number;
}

export interface RakeByPeriod {
  period: string;
  amount: number;
  count: number;
}

export interface RakeRecord {
  _id: string;
  eventId: {
    _id: string;
    title: string;
    category: string;
  } | string;
  amount: number;
  poolTotal: number;
  rakePercent: number;
  status: 'pending' | 'available' | 'withdrawn';
  withdrawnAt?: string;
  withdrawalReference?: string;
  createdAt: string;
}

export interface PaginatedRakeRecords {
  records: RakeRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface WithdrawRevenueResult {
  success: boolean;
  reference: string;
}

export const revenueApi = {
  getStats: async (): Promise<RevenueStats> => {
    const response = await api.get('/admin/revenue/stats');
    return response.data;
  },

  getByPeriod: async (period: 'day' | 'week' | 'month' = 'day', limit = 30): Promise<RakeByPeriod[]> => {
    const response = await api.get(`/admin/revenue/by-period?period=${period}&limit=${limit}`);
    return response.data;
  },

  getHistory: async (page = 1, limit = 20, status?: string): Promise<PaginatedRakeRecords> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get(`/admin/revenue/history?${params.toString()}`);
    return response.data;
  },

  getTopEvents: async (limit = 10): Promise<RakeRecord[]> => {
    const response = await api.get(`/admin/revenue/top-events?limit=${limit}`);
    return response.data;
  },

  getByEvent: async (eventId: string): Promise<RakeRecord | null> => {
    const response = await api.get(`/admin/revenue/event/${eventId}`);
    return response.data;
  },

  withdrawRevenue: async (amount: number, withdrawalAddress: string): Promise<WithdrawRevenueResult> => {
    const response = await api.post('/admin/revenue/withdraw', { amount, withdrawalAddress });
    return response.data;
  },
};
