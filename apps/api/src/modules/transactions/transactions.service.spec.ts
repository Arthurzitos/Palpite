import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { Transaction } from './schemas/transaction.schema';
import { TransactionType, TransactionStatus } from '@prediction-market/shared';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockTransaction = {
    _id: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439012',
    type: TransactionType.DEPOSIT,
    amount: 100,
    balanceBefore: 0,
    balanceAfter: 100,
    status: TransactionStatus.COMPLETED,
    reference: 'test-ref',
    metadata: { provider: 'ccpayment' },
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockTransactionModel = {
    new: jest.fn().mockResolvedValue(mockTransaction),
    constructor: jest.fn().mockResolvedValue(mockTransaction),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find a transaction by id', async () => {
      mockTransactionModel.findById.mockResolvedValue(mockTransaction);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should return null for invalid ObjectId', async () => {
      mockTransactionModel.findById.mockRejectedValue(new Error('Invalid ObjectId'));

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByReference', () => {
    it('should find a transaction by reference', async () => {
      mockTransactionModel.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findByReference('test-ref');

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({ reference: 'test-ref' });
    });

    it('should return null when transaction not found', async () => {
      mockTransactionModel.findOne.mockResolvedValue(null);

      const result = await service.findByReference('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return paginated transactions for a user', async () => {
      const transactions = [mockTransaction];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(transactions),
      };
      mockTransactionModel.find.mockReturnValue(mockQuery);
      mockTransactionModel.countDocuments.mockResolvedValue(1);

      const result = await service.findByUser({
        userId: '507f1f77bcf86cd799439012',
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toEqual(transactions);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        pages: 1,
      });
    });

    it('should filter by type when provided', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      mockTransactionModel.find.mockReturnValue(mockQuery);
      mockTransactionModel.countDocuments.mockResolvedValue(0);

      await service.findByUser({
        userId: '507f1f77bcf86cd799439012',
        type: TransactionType.DEPOSIT,
      });

      expect(mockTransactionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: TransactionType.DEPOSIT }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      const updatedTransaction = { ...mockTransaction, status: TransactionStatus.FAILED };
      mockTransactionModel.findByIdAndUpdate.mockResolvedValue(updatedTransaction);

      const result = await service.updateStatus(
        '507f1f77bcf86cd799439011',
        TransactionStatus.FAILED,
      );

      expect(result?.status).toBe(TransactionStatus.FAILED);
      expect(mockTransactionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: TransactionStatus.FAILED },
        { new: true },
      );
    });
  });

  describe('checkIdempotency', () => {
    it('should return true if transaction is already completed', async () => {
      mockTransactionModel.findOne.mockResolvedValue(mockTransaction);

      const result = await service.checkIdempotency('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        status: TransactionStatus.COMPLETED,
      });
    });

    it('should return false if transaction is not completed', async () => {
      mockTransactionModel.findOne.mockResolvedValue(null);

      const result = await service.checkIdempotency('507f1f77bcf86cd799439011');

      expect(result).toBe(false);
    });

    it('should return false for invalid ObjectId', async () => {
      mockTransactionModel.findOne.mockRejectedValue(new Error('Invalid ObjectId'));

      const result = await service.checkIdempotency('invalid-id');

      expect(result).toBe(false);
    });
  });

  describe('findPendingByProvider', () => {
    it('should find pending transactions by provider within time limit', async () => {
      const pendingTransactions = [
        { ...mockTransaction, status: TransactionStatus.PENDING },
      ];
      mockTransactionModel.find.mockResolvedValue(pendingTransactions);

      const result = await service.findPendingByProvider('ccpayment', 60);

      expect(result).toEqual(pendingTransactions);
      expect(mockTransactionModel.find).toHaveBeenCalledWith({
        status: TransactionStatus.PENDING,
        type: TransactionType.DEPOSIT,
        'metadata.provider': 'ccpayment',
        createdAt: expect.any(Object),
      });
    });

    it('should use default maxAgeMinutes of 60', async () => {
      mockTransactionModel.find.mockResolvedValue([]);

      await service.findPendingByProvider('nowpayments');

      expect(mockTransactionModel.find).toHaveBeenCalled();
    });
  });

  describe('markAsFailed', () => {
    it('should mark transaction as failed with reason', async () => {
      const failedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.FAILED,
        metadata: { failureReason: 'Payment expired' },
      };
      mockTransactionModel.findByIdAndUpdate.mockResolvedValue(failedTransaction);

      const result = await service.markAsFailed(
        '507f1f77bcf86cd799439011',
        'Payment expired',
      );

      expect(result?.status).toBe(TransactionStatus.FAILED);
      expect(mockTransactionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          status: TransactionStatus.FAILED,
          'metadata.failureReason': 'Payment expired',
        },
        { new: true },
      );
    });
  });

  describe('updateMetadata', () => {
    it('should update transaction metadata fields', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        metadata: { provider: 'ccpayment', invoiceId: 'inv-123' },
      };
      mockTransactionModel.findByIdAndUpdate.mockResolvedValue(updatedTransaction);

      await service.updateMetadata('507f1f77bcf86cd799439011', {
        invoiceId: 'inv-123',
      });

      expect(mockTransactionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { 'metadata.invoiceId': 'inv-123' },
        { new: true },
      );
    });
  });
});
