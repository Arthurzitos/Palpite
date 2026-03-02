import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

export interface NowPaymentsInvoiceResponse {
  id: string;
  order_id: string;
  order_description: string;
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  ipn_callback_url: string;
  invoice_url: string;
  created_at: string;
  updated_at: string;
}

export interface NowPaymentsPaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
}

export interface NowPaymentsWebhookPayload {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount?: number;
  outcome_currency?: string;
  created_at: string;
  updated_at: string;
}

export type NowPaymentsStatus =
  | 'waiting'
  | 'confirming'
  | 'confirmed'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'expired';

export interface NowPaymentsPayoutRequest {
  address: string;
  currency: string;
  amount: number;
  ipn_callback_url?: string;
  extraId?: string;
}

export interface NowPaymentsPayoutResponse {
  id: string;
  withdrawals: Array<{
    id: string;
    address: string;
    currency: string;
    amount: number;
    status: string;
    extra_id?: string;
    hash?: string;
    error?: string;
  }>;
}

export interface NowPaymentsAuthResponse {
  token: string;
}

@Injectable()
export class NowPaymentsService {
  private readonly logger = new Logger(NowPaymentsService.name);
  private readonly apiBaseUrl = 'https://api.nowpayments.io/v1';
  private readonly apiKey: string;
  private readonly ipnSecret: string;
  private readonly webhookUrl: string;
  private readonly payoutAddress: string;
  private readonly payoutCurrency: string;
  private readonly payoutEmail: string;
  private readonly payoutPassword: string;
  private jwtToken: string | null = null;
  private jwtExpiresAt: number = 0;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('nowpayments.apiKey') || '';
    this.ipnSecret = this.configService.get<string>('nowpayments.ipnSecret') || '';
    this.webhookUrl = this.configService.get<string>('nowpayments.webhookUrl') || '';
    this.payoutAddress = this.configService.get<string>('nowpayments.payoutAddress') || '';
    this.payoutCurrency =
      this.configService.get<string>('nowpayments.payoutCurrency') || 'usdttrc20';
    this.payoutEmail = this.configService.get<string>('nowpayments.payoutEmail') || '';
    this.payoutPassword = this.configService.get<string>('nowpayments.payoutPassword') || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, options);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`NOWPayments API error: ${response.status} - ${errorText}`);
      throw new BadRequestException('Payment gateway error');
    }

    return response.json() as Promise<T>;
  }

  async createInvoice(
    amount: number,
    orderId: string,
    description: string,
  ): Promise<{ invoiceUrl: string; invoiceId: string }> {
    if (!this.apiKey) {
      throw new BadRequestException('Fiat payment gateway not configured');
    }

    const body = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: this.payoutCurrency,
      ipn_callback_url: this.webhookUrl,
      order_id: orderId,
      order_description: description,
      success_url: `${this.configService.get<string>('frontendUrl')}/wallet?deposit=success`,
      cancel_url: `${this.configService.get<string>('frontendUrl')}/wallet?deposit=cancelled`,
    };

    const response = await this.makeRequest<NowPaymentsInvoiceResponse>('/invoice', 'POST', body);

    return {
      invoiceUrl: response.invoice_url,
      invoiceId: response.id,
    };
  }

  async createPayment(
    amount: number,
    orderId: string,
    description: string,
  ): Promise<NowPaymentsPaymentResponse> {
    if (!this.apiKey) {
      throw new BadRequestException('Fiat payment gateway not configured');
    }

    const body = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: this.payoutCurrency,
      ipn_callback_url: this.webhookUrl,
      order_id: orderId,
      order_description: description,
      payout_address: this.payoutAddress,
      payout_currency: this.payoutCurrency,
    };

    return this.makeRequest<NowPaymentsPaymentResponse>('/payment', 'POST', body);
  }

  async getPaymentStatus(paymentId: string): Promise<NowPaymentsPaymentResponse> {
    return this.makeRequest<NowPaymentsPaymentResponse>(`/payment/${paymentId}`, 'GET');
  }

  async checkApiStatus(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ message: string }>('/status', 'GET');
      return response.message === 'OK';
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(body: Record<string, unknown>, receivedSig: string): boolean {
    if (!this.ipnSecret) {
      this.logger.warn('NOWPayments IPN secret not configured');
      return false;
    }

    const sortedKeys = Object.keys(body).sort();
    const sortedBody: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedBody[key] = body[key];
    }
    const sortedBodyString = JSON.stringify(sortedBody);

    const expectedSig = createHmac('sha512', this.ipnSecret).update(sortedBodyString).digest('hex');

    if (expectedSig !== receivedSig) {
      this.logger.warn('Invalid NOWPayments webhook signature');
      return false;
    }

    return true;
  }

  isPaymentFinished(status: NowPaymentsStatus): boolean {
    return status === 'finished';
  }

  isPaymentFailed(status: NowPaymentsStatus): boolean {
    return status === 'failed' || status === 'refunded' || status === 'expired';
  }

  getWidgetConfig(amount: number, orderId: string): Record<string, string> {
    return {
      api_key: this.apiKey,
      amount: amount.toString(),
      currency: 'usd',
      order_id: orderId,
      pay_currency: this.payoutCurrency,
      payout_address: this.payoutAddress,
      ipn_callback_url: this.webhookUrl,
      success_url: `${this.configService.get<string>('frontendUrl')}/wallet?deposit=success`,
      cancel_url: `${this.configService.get<string>('frontendUrl')}/wallet?deposit=cancelled`,
    };
  }

  private async authenticate(): Promise<string> {
    if (this.jwtToken && Date.now() < this.jwtExpiresAt) {
      return this.jwtToken;
    }

    if (!this.payoutEmail || !this.payoutPassword) {
      throw new BadRequestException('NOWPayments payout credentials not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.payoutEmail,
        password: this.payoutPassword,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`NOWPayments auth error: ${response.status} - ${errorText}`);
      throw new BadRequestException('Failed to authenticate with payment gateway');
    }

    const data = (await response.json()) as NowPaymentsAuthResponse;
    this.jwtToken = data.token;
    this.jwtExpiresAt = Date.now() + 25 * 60 * 1000; // Token valid for ~30min, refresh at 25min

    return this.jwtToken;
  }

  async createPayout(
    amount: number,
    address: string,
    currency?: string,
    extraId?: string,
  ): Promise<NowPaymentsPayoutResponse> {
    if (!this.apiKey) {
      throw new BadRequestException('NOWPayments not configured');
    }

    const jwt = await this.authenticate();

    const withdrawal: NowPaymentsPayoutRequest = {
      address,
      currency: currency || this.payoutCurrency,
      amount,
      ipn_callback_url: this.webhookUrl,
    };

    if (extraId) {
      withdrawal.extraId = extraId;
    }

    const response = await fetch(`${this.apiBaseUrl}/payout`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ withdrawals: [withdrawal] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`NOWPayments payout error: ${response.status} - ${errorText}`);
      throw new BadRequestException('Failed to create payout');
    }

    const data = (await response.json()) as NowPaymentsPayoutResponse;
    this.logger.log(`Payout created: ${data.id} for ${amount} ${currency || this.payoutCurrency}`);

    return data;
  }

  async getPayoutStatus(payoutId: string): Promise<NowPaymentsPayoutResponse> {
    const jwt = await this.authenticate();

    const response = await fetch(`${this.apiBaseUrl}/payout/${payoutId}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`NOWPayments payout status error: ${response.status} - ${errorText}`);
      throw new BadRequestException('Failed to get payout status');
    }

    return response.json() as Promise<NowPaymentsPayoutResponse>;
  }

  async getAccountBalance(): Promise<{ currency: string; amount: number }[]> {
    const jwt = await this.authenticate();

    const response = await fetch(`${this.apiBaseUrl}/balance`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`NOWPayments balance error: ${response.status} - ${errorText}`);
      throw new BadRequestException('Failed to get account balance');
    }

    return response.json() as Promise<{ currency: string; amount: number }[]>;
  }

  isPayoutConfigured(): boolean {
    return !!(this.apiKey && this.payoutEmail && this.payoutPassword);
  }
}
