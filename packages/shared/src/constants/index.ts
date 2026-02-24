export const PLATFORM_CONSTANTS = {
  FEE_PERCENT: 3,
  MIN_BET_AMOUNT: 1,
  MAX_BET_AMOUNT: 10000,
  MIN_DEPOSIT_AMOUNT: 5,
  MIN_WITHDRAWAL_AMOUNT: 10,
  DEFAULT_INITIAL_BALANCE: 0,
} as const;

export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  sports: 'Esportes',
  crypto: 'Crypto',
  politics: 'Politica',
  entertainment: 'Entretenimento',
  other: 'Outros',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  locked: 'Travado',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
} as const;

export const BET_STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  won: 'Ganhou',
  lost: 'Perdeu',
  refunded: 'Reembolsada',
} as const;
