import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { PaymentPollingService } from './payment-polling.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { UsersService } from '../../users/users.service';
import { NowPaymentsService } from './nowpayments.service';
import { TransactionStatus, TransactionType } from '@prediction-market/shared';

describe('PaymentPollingService', () => {
  let service: PaymentPollingService;
  let transactionsService: jest.Mocked<TransactionsService>;
  let usersService: jest.Mocked<UsersService>;
  let nowPaymentsService: jest.Mocked<NowPaymentsService>;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    abortTransaction: jest.fn().mockResolvedValue(undefined),
    endSession: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  const createMockTransaction = (overrides = {}) => ({
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    userId: { toString: () => '507f1f77bcf86cd799439012' },
    type: TransactionType.DEPOSIT,
    amount: 100,
    status: TransactionStatus.PENDING,
    metadata: {
      provider: 'nowpayments',
      invoiceId: 'inv-123',
    },
    createdAt: new Date(),
    balanceAfter: 0,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    balance: 200,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentPollingService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: TransactionsService,
          useValue: {
            findPendingByProvider: jest.fn(),
            checkIdempotency: jest.fn(),
            markAsFailed: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            updateBalance: jest.fn(),
            incrementStats: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: NowPaymentsService,
          useValue: {
            getPaymentStatus: jest.fn(),
            isPaymentFinished: jest.fn(),
            isPaymentFailed: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentPollingService>(PaymentPollingService);
    transactionsService = module.get(TransactionsService);
    usersService = module.get(UsersService);
    nowPaymentsService = module.get(NowPaymentsService);

    jest.clearAllMocks();
  });

  describe('pollPendingPayments', () => {
    it('should poll NOWPayments deposits', async () => {
      transactionsService.findPendingByProvider.mockResolvedValue([]);

      await service.pollPendingPayments();

      expect(transactionsService.findPendingByProvider).toHaveBeenCalledWith('nowpayments', 60);
    });

    it('should skip if polling is already running', async () => {
      transactionsService.findPendingByProvider.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      // Start first poll
      const firstPoll = service.pollPendingPayments();

      // Try to start second poll immediately
      await service.pollPendingPayments();

      await firstPoll;

      // Should have only been called once (in the first poll)
      expect(transactionsService.findPendingByProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('NOWPayments polling', () => {
    it('should process successful NOWPayments deposit', async () => {
      const pendingTransaction = createMockTransaction();
      transactionsService.findPendingByProvider.mockResolvedValueOnce(
        [pendingTransaction] as any,
      );
      transactionsService.checkIdempotency.mockResolvedValue(false);
      transactionsService.findById.mockResolvedValue(pendingTransaction as any);
      usersService.findById.mockResolvedValue(mockUser as any);

      nowPaymentsService.getPaymentStatus.mockResolvedValue({
        payment_status: 'finished',
        price_amount: 100,
      } as any);
      nowPaymentsService.isPaymentFinished.mockReturnValue(true);

      await service.pollPendingPayments();

      expect(usersService.updateBalance).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        100,
        'add',
      );
      expect(usersService.incrementStats).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        'totalDeposited',
        100,
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should mark failed NOWPayments deposit', async () => {
      const pendingTransaction = createMockTransaction();
      transactionsService.findPendingByProvider.mockResolvedValueOnce(
        [pendingTransaction] as any,
      );

      nowPaymentsService.getPaymentStatus.mockResolvedValue({
        payment_status: 'failed',
        price_amount: 100,
      } as any);
      nowPaymentsService.isPaymentFinished.mockReturnValue(false);
      nowPaymentsService.isPaymentFailed.mockReturnValue(true);

      await service.pollPendingPayments();

      expect(transactionsService.markAsFailed).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'Payment failed',
      );
    });

    it('should skip transaction without invoiceId', async () => {
      const transactionWithoutInvoice = createMockTransaction({
        metadata: { provider: 'nowpayments' },
      });
      transactionsService.findPendingByProvider.mockResolvedValueOnce(
        [transactionWithoutInvoice] as any,
      );

      await service.pollPendingPayments();

      expect(nowPaymentsService.getPaymentStatus).not.toHaveBeenCalled();
    });
  });

  describe('idempotency', () => {
    it('should skip already processed transactions', async () => {
      const pendingTransaction = createMockTransaction();
      transactionsService.findPendingByProvider.mockResolvedValueOnce(
        [pendingTransaction] as any,
      );
      transactionsService.checkIdempotency.mockResolvedValue(true);

      nowPaymentsService.getPaymentStatus.mockResolvedValue({
        payment_status: 'finished',
        price_amount: 100,
      } as any);
      nowPaymentsService.isPaymentFinished.mockReturnValue(true);

      await service.pollPendingPayments();

      expect(usersService.updateBalance).not.toHaveBeenCalled();
    });
  });

  describe('expireOldPendingTransactions', () => {
    it('should expire old pending transactions', async () => {
      const oldTransaction = createMockTransaction({
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      });

      transactionsService.findPendingByProvider.mockResolvedValue([oldTransaction] as any);

      await service.expireOldPendingTransactions();

      expect(transactionsService.markAsFailed).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'Transaction expired',
      );
    });

    it('should not expire recent transactions', async () => {
      const recentTransaction = createMockTransaction({
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      });

      transactionsService.findPendingByProvider.mockResolvedValue([recentTransaction] as any);

      await service.expireOldPendingTransactions();

      expect(transactionsService.markAsFailed).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully and continue polling', async () => {
      transactionsService.findPendingByProvider.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(service.pollPendingPayments()).resolves.not.toThrow();
    });

    it('should rollback transaction on processing error', async () => {
      const pendingTransaction = createMockTransaction();
      transactionsService.findPendingByProvider.mockResolvedValueOnce(
        [pendingTransaction] as any,
      );
      transactionsService.checkIdempotency.mockResolvedValue(false);

      nowPaymentsService.getPaymentStatus.mockResolvedValue({
        payment_status: 'finished',
        price_amount: 100,
      } as any);
      nowPaymentsService.isPaymentFinished.mockReturnValue(true);

      usersService.updateBalance.mockRejectedValue(new Error('Balance update failed'));

      await service.pollPendingPayments();

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
