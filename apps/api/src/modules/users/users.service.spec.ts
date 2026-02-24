import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { UserRole } from '@prediction-market/shared';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashedpassword123',
    role: UserRole.USER,
    balance: 100,
    totalWagered: 50,
    totalWon: 25,
    totalDeposited: 200,
    totalWithdrawn: 75,
    refreshToken: null,
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockUserModel = {
    new: jest.fn().mockResolvedValue(mockUser),
    constructor: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const saveMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.constructor = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));

      // Create a mock constructor
      const MockModel = function (data: any) {
        return { ...data, save: saveMock };
      } as any;
      MockModel.findOne = mockUserModel.findOne;

      const moduleWithMock = await Test.createTestingModule({
        providers: [
          UsersService,
          {
            provide: getModelToken(User.name),
            useValue: MockModel,
          },
        ],
      }).compile();

      const serviceWithMock = moduleWithMock.get<UsersService>(UsersService);

      await serviceWithMock.create({
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        email: 'existing@example.com',
      });

      await expect(
        service.create({
          email: 'existing@example.com',
          password: 'password123',
          username: 'newuser',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when username already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        email: 'different@example.com',
        username: 'existinguser',
      });

      await expect(
        service.create({
          email: 'new@example.com',
          password: 'password123',
          username: 'existinguser',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (lowercase)', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('TEST@EXAMPLE.COM');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(mockUser as any, 'correctpassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedpassword123');
    });

    it('should return false for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(mockUser as any, 'wrongpassword');

      expect(result).toBe(false);
    });
  });

  describe('updateRefreshToken', () => {
    it('should update refresh token with hashed value', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedtoken');
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.updateRefreshToken('507f1f77bcf86cd799439011', 'newrefreshtoken');

      expect(bcrypt.hash).toHaveBeenCalledWith('newrefreshtoken', 10);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        refreshToken: 'hashedtoken',
      });
    });

    it('should set refresh token to null when passed null', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.updateRefreshToken('507f1f77bcf86cd799439011', null);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        refreshToken: null,
      });
    });
  });

  describe('validateRefreshToken', () => {
    it('should return true for valid refresh token', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const userWithToken = { ...mockUser, refreshToken: 'hashedtoken' };
      const result = await service.validateRefreshToken(userWithToken as any, 'validtoken');

      expect(result).toBe(true);
    });

    it('should return false when user has no refresh token', async () => {
      const userWithoutToken = { ...mockUser, refreshToken: null };
      const result = await service.validateRefreshToken(userWithoutToken as any, 'anytoken');

      expect(result).toBe(false);
    });

    it('should return false for invalid refresh token', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const userWithToken = { ...mockUser, refreshToken: 'hashedtoken' };
      const result = await service.validateRefreshToken(userWithToken as any, 'invalidtoken');

      expect(result).toBe(false);
    });
  });

  describe('updateBalance', () => {
    it('should add to balance', async () => {
      const updatedUser = { ...mockUser, balance: 150 };
      mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.updateBalance('507f1f77bcf86cd799439011', 50, 'add');

      expect(result?.balance).toBe(150);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $inc: { balance: 50 } },
        { new: true },
      );
    });

    it('should subtract from balance with balance check', async () => {
      const updatedUser = { ...mockUser, balance: 50 };
      mockUserModel.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.updateBalance('507f1f77bcf86cd799439011', 50, 'subtract');

      expect(result?.balance).toBe(50);
      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011', balance: { $gte: 50 } },
        { $inc: { balance: -50 } },
        { new: true },
      );
    });

    it('should return null when insufficient balance for subtract', async () => {
      mockUserModel.findOneAndUpdate.mockResolvedValue(null);

      const result = await service.updateBalance('507f1f77bcf86cd799439011', 500, 'subtract');

      expect(result).toBeNull();
    });
  });

  describe('getBalance', () => {
    it('should return user balance', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.getBalance('507f1f77bcf86cd799439011');

      expect(result).toBe(100);
    });
  });

  describe('incrementStats', () => {
    it('should increment totalDeposited', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.incrementStats('507f1f77bcf86cd799439011', 'totalDeposited', 100);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        $inc: { totalDeposited: 100 },
      });
    });

    it('should increment totalWithdrawn', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.incrementStats('507f1f77bcf86cd799439011', 'totalWithdrawn', 50);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        $inc: { totalWithdrawn: 50 },
      });
    });

    it('should increment totalWagered', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.incrementStats('507f1f77bcf86cd799439011', 'totalWagered', 25);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        $inc: { totalWagered: 25 },
      });
    });

    it('should increment totalWon', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.incrementStats('507f1f77bcf86cd799439011', 'totalWon', 75);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        $inc: { totalWon: 75 },
      });
    });
  });

  describe('toPublic', () => {
    it('should return public user data without sensitive fields', () => {
      const result = service.toPublic(mockUser as any);

      expect(result).toEqual({
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.USER,
        balance: 100,
        totalWagered: 50,
        totalWon: 25,
        createdAt: mockUser.createdAt,
      });

      // Should not include sensitive fields
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
    });
  });
});
