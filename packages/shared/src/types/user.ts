import { UserRole } from '../enums';

export interface User {
  _id: string;
  email: string;
  username: string;
  role: UserRole;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  username: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface UserPublic {
  _id: string;
  email: string;
  username: string;
  role: UserRole;
  balance: number;
  totalWagered: number;
  totalWon: number;
  createdAt: Date;
}
