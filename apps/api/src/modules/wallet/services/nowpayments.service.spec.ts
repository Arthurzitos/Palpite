import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { NowPaymentsService, NowPaymentsStatus } from './nowpayments.service';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('NowPaymentsService', () => {
  let service: NowPaymentsService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'nowpayments.apiKey': 'test-api-key',
        'nowpayments.ipnSecret': 'test-ipn-secret',
        'nowpayments.webhookUrl': 'https://example.com/webhook/nowpayments',
        'nowpayments.payoutAddress': 'TRX123payoutaddress',
        'nowpayments.payoutCurrency': 'usdttrc20',
        frontendUrl: 'https://example.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NowPaymentsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NowPaymentsService>(NowPaymentsService);
    jest.clearAllMocks();
  });

  describe('isPaymentFinished', () => {
    it('should return true for finished status', () => {
      expect(service.isPaymentFinished('finished')).toBe(true);
    });

    it('should return false for non-finished statuses', () => {
      const nonFinishedStatuses: NowPaymentsStatus[] = [
        'waiting',
        'confirming',
        'confirmed',
        'sending',
        'failed',
        'refunded',
        'expired',
      ];

      nonFinishedStatuses.forEach((status) => {
        expect(service.isPaymentFinished(status)).toBe(false);
      });
    });
  });

  describe('isPaymentFailed', () => {
    it('should return true for failed status', () => {
      expect(service.isPaymentFailed('failed')).toBe(true);
    });

    it('should return true for refunded status', () => {
      expect(service.isPaymentFailed('refunded')).toBe(true);
    });

    it('should return true for expired status', () => {
      expect(service.isPaymentFailed('expired')).toBe(true);
    });

    it('should return false for other statuses', () => {
      const nonFailedStatuses: NowPaymentsStatus[] = [
        'waiting',
        'confirming',
        'confirmed',
        'sending',
        'finished',
      ];

      nonFailedStatuses.forEach((status) => {
        expect(service.isPaymentFailed(status)).toBe(false);
      });
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature with sorted body', () => {
      const body = { b_field: 'value2', a_field: 'value1' };

      // Generate expected signature (sorted body)
      const crypto = require('crypto');
      const sortedBody = { a_field: 'value1', b_field: 'value2' };
      const sortedBodyString = JSON.stringify(sortedBody);
      const expectedSig = crypto
        .createHmac('sha512', 'test-ipn-secret')
        .update(sortedBodyString)
        .digest('hex');

      const result = service.verifyWebhookSignature(body, expectedSig);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const body = { payment_id: 123, status: 'finished' };

      const result = service.verifyWebhookSignature(body, 'invalid-signature');

      expect(result).toBe(false);
    });
  });

  describe('getWidgetConfig', () => {
    it('should return correct widget configuration', () => {
      const result = service.getWidgetConfig(100, 'order-123');

      expect(result).toEqual({
        api_key: 'test-api-key',
        amount: '100',
        currency: 'usd',
        order_id: 'order-123',
        pay_currency: 'usdttrc20',
        payout_address: 'TRX123payoutaddress',
        ipn_callback_url: 'https://example.com/webhook/nowpayments',
        success_url: 'https://example.com/wallet?deposit=success',
        cancel_url: 'https://example.com/wallet?deposit=cancelled',
      });
    });
  });

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'inv-123',
            invoice_url: 'https://nowpayments.io/payment/inv-123',
            order_id: 'order-123',
          }),
      });

      const result = await service.createInvoice(100, 'order-123', 'Deposit $100');

      expect(result.invoiceUrl).toBe('https://nowpayments.io/payment/inv-123');
      expect(result.invoiceId).toBe('inv-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.nowpayments.io/v1/invoice',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should throw BadRequestException when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      });

      await expect(service.createInvoice(100, 'order-123', 'Deposit')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const mockResponse = {
        payment_id: 'pay-123',
        payment_status: 'waiting',
        pay_address: 'TRX123',
        price_amount: 100,
        price_currency: 'usd',
        pay_amount: 100,
        pay_currency: 'usdttrc20',
        order_id: 'order-123',
        order_description: 'Deposit',
        purchase_id: 'purchase-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.createPayment(100, 'order-123', 'Deposit');

      expect(result.payment_id).toBe('pay-123');
      expect(result.payment_status).toBe('waiting');
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      const mockResponse = {
        payment_id: 'pay-123',
        payment_status: 'finished',
        price_amount: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.getPaymentStatus('pay-123');

      expect(result.payment_status).toBe('finished');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.nowpayments.io/v1/payment/pay-123',
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });
  });

  describe('checkApiStatus', () => {
    it('should return true when API is OK', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'OK' }),
      });

      const result = await service.checkApiStatus();

      expect(result).toBe(true);
    });

    it('should return false when API returns non-OK message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Maintenance' }),
      });

      const result = await service.checkApiStatus();

      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.checkApiStatus();

      expect(result).toBe(false);
    });
  });

  describe('configuration checks', () => {
    it('should throw when apiKey is not configured for createInvoice', async () => {
      const unconfiguredService = await createUnconfiguredService();

      await expect(
        unconfiguredService.createInvoice(100, 'order-123', 'Deposit'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when apiKey is not configured for createPayment', async () => {
      const unconfiguredService = await createUnconfiguredService();

      await expect(
        unconfiguredService.createPayment(100, 'order-123', 'Deposit'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

async function createUnconfiguredService(): Promise<NowPaymentsService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      NowPaymentsService,
      {
        provide: ConfigService,
        useValue: {
          get: () => undefined,
        },
      },
    ],
  }).compile();

  return module.get<NowPaymentsService>(NowPaymentsService);
}
