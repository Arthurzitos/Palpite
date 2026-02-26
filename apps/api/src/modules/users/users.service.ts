import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    const update = operation === 'add' ? { $inc: { balance: amount } } : { $inc: { balance: -amount } };

    if (operation === 'subtract') {
      return this.userModel.findOneAndUpdate(
        { _id: userId, balance: { $gte: amount } },
        update,
        { new: true },
      );
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
}
