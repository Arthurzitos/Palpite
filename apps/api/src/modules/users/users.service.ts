import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '@prediction-market/shared';

export interface CreateUserInput {
  email: string;
  password: string;
  username: string;
  role?: UserRole;
  balance?: number;
}

export interface UserFilters {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: ReturnType<UsersService['toPublic']>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    const { email, password, username, role = UserRole.USER, balance = 0 } = input;

    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      email: email.toLowerCase(),
      passwordHash,
      username,
      role,
      balance,
    });

    return user.save();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }

  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashedToken });
  }

  async validateRefreshToken(user: UserDocument, refreshToken: string): Promise<boolean> {
    if (!user.refreshToken) {
      return false;
    }
    return bcrypt.compare(refreshToken, user.refreshToken);
  }

  async updateBalance(
    userId: string,
    amount: number,
    operation: 'add' | 'subtract',
  ): Promise<UserDocument | null> {
    const update =
      operation === 'add' ? { $inc: { balance: amount } } : { $inc: { balance: -amount } };

    if (operation === 'subtract') {
      return this.userModel.findOneAndUpdate({ _id: userId, balance: { $gte: amount } }, update, {
        new: true,
      });
    }

    return this.userModel.findByIdAndUpdate(userId, update, { new: true });
  }

  async getBalance(userId: string): Promise<number> {
    const user = await this.findById(userId);
    return user.balance;
  }

  async incrementStats(
    userId: string,
    field: 'totalDeposited' | 'totalWithdrawn' | 'totalWagered' | 'totalWon',
    amount: number,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { [field]: amount },
    });
  }

  toPublic(user: UserDocument) {
    return {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      balance: user.balance,
      totalWagered: user.totalWagered,
      totalWon: user.totalWon,
      createdAt: user.createdAt,
    };
  }

  toAdminView(user: UserDocument) {
    return {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      balance: user.balance,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn,
      totalWagered: user.totalWagered,
      totalWon: user.totalWon,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll(filters: UserFilters): Promise<PaginatedUsers> {
    const { role, search, page = 1, limit = 20 } = filters;
    const query: FilterQuery<User> = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users: users.map((user) => this.toAdminView(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRole(userId: string, role: UserRole): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, { role }, { new: true });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async adjustBalance(
    userId: string,
    amount: number,
    operation: 'add' | 'subtract',
    _reason?: string, // Reserved for audit logs
  ): Promise<UserDocument> {
    const user = await this.findById(userId);

    if (operation === 'subtract' && user.balance < amount) {
      throw new BadRequestException('Insufficient balance for this adjustment');
    }

    const update =
      operation === 'add' ? { $inc: { balance: amount } } : { $inc: { balance: -amount } };

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, update, {
      new: true,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async getUserStats(): Promise<UserStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, totalAdmins, newUsersThisMonth] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    // Active users = users who have placed bets (totalWagered > 0)
    const activeUsers = await this.userModel.countDocuments({
      totalWagered: { $gt: 0 },
    });

    return {
      totalUsers,
      totalAdmins,
      activeUsers,
      newUsersThisMonth,
    };
  }

  async searchByEmailOrUsername(search: string): Promise<UserDocument[]> {
    return this.userModel.find({
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ],
    });
  }
}
