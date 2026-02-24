export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/prediction-market',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-prod',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  nowpayments: {
    apiKey: process.env.NOWPAYMENTS_API_KEY,
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
    webhookUrl: process.env.NOWPAYMENTS_WEBHOOK_URL,
    payoutAddress: process.env.NOWPAYMENTS_PAYOUT_ADDRESS,
    payoutCurrency: process.env.NOWPAYMENTS_PAYOUT_CURRENCY || 'usdttrc20',
    payoutEmail: process.env.NOWPAYMENTS_EMAIL,
    payoutPassword: process.env.NOWPAYMENTS_PASSWORD,
  },

  platform: {
    feePercent: parseInt(process.env.PLATFORM_FEE_PERCENT || '3', 10),
    minBetAmount: parseInt(process.env.MIN_BET_AMOUNT || '1', 10),
    maxBetAmount: parseInt(process.env.MAX_BET_AMOUNT || '10000', 10),
    minDepositAmount: parseInt(process.env.MIN_DEPOSIT_AMOUNT || '5', 10),
    minWithdrawalAmount: parseInt(process.env.MIN_WITHDRAWAL_AMOUNT || '10', 10),
  },
});
