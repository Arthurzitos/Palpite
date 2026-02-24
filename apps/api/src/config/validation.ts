import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  API_URL: Joi.string().default('http://localhost:3001'),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  MONGODB_URI: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  CCPAYMENT_APP_ID: Joi.string().optional(),
  CCPAYMENT_APP_SECRET: Joi.string().optional(),
  CCPAYMENT_WEBHOOK_URL: Joi.string().optional(),

  NOWPAYMENTS_API_KEY: Joi.string().optional(),
  NOWPAYMENTS_IPN_SECRET: Joi.string().optional(),
  NOWPAYMENTS_WEBHOOK_URL: Joi.string().optional(),
  NOWPAYMENTS_PAYOUT_ADDRESS: Joi.string().optional(),
  NOWPAYMENTS_PAYOUT_CURRENCY: Joi.string().default('usdttrc20'),

  PLATFORM_FEE_PERCENT: Joi.number().default(3),
  MIN_BET_AMOUNT: Joi.number().default(1),
  MAX_BET_AMOUNT: Joi.number().default(10000),
  MIN_DEPOSIT_AMOUNT: Joi.number().default(5),
  MIN_WITHDRAWAL_AMOUNT: Joi.number().default(10),
});
