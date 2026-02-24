import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module';

describe('Wallet Webhooks (e2e)', () => {
  let app: INestApplication;

  const NOWPAYMENTS_IPN_SECRET = 'test-ipn-secret';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('NOWPayments Webhook (/api/wallet/webhook/nowpayments)', () => {
    const createNowPaymentsSignature = (
      body: Record<string, unknown>,
      ipnSecret: string,
    ): string => {
      const sortedBody = JSON.stringify(body, Object.keys(body).sort());
      return createHmac('sha512', ipnSecret).update(sortedBody).digest('hex');
    };

    it('should reject webhook with invalid signature', async () => {
      const body = {
        payment_id: 12345,
        payment_status: 'finished',
        order_id: 'tx-123',
        outcome_amount: '100',
        pay_currency: 'usdttrc20',
      };

      return request(app.getHttpServer())
        .post('/api/wallet/webhook/nowpayments')
        .set('x-nowpayments-sig', 'invalid-signature')
        .send(body)
        .expect(401);
    });

    it('should ignore non-finished status webhooks', async () => {
      const body = {
        payment_id: 12345,
        payment_status: 'confirming', // Not finished
        order_id: 'tx-123',
        outcome_amount: '100',
        pay_currency: 'usdttrc20',
      };

      const signature = createNowPaymentsSignature(body, NOWPAYMENTS_IPN_SECRET);

      const response = await request(app.getHttpServer())
        .post('/api/wallet/webhook/nowpayments')
        .set('x-nowpayments-sig', signature)
        .send(body);

      // Should return 200 (ignored) or the actual status
      expect([200]).toContain(response.status);
    });

    it('should accept webhook with valid signature and finished status', async () => {
      const body = {
        payment_id: 12345,
        payment_status: 'finished',
        order_id: 'tx-nonexistent',
        outcome_amount: '100',
        pay_currency: 'usdttrc20',
      };

      const signature = createNowPaymentsSignature(body, NOWPAYMENTS_IPN_SECRET);

      const response = await request(app.getHttpServer())
        .post('/api/wallet/webhook/nowpayments')
        .set('x-nowpayments-sig', signature)
        .send(body);

      // Expect either 200 (success) or 404 (transaction not found)
      expect([200, 404]).toContain(response.status);
    });
  });
});
