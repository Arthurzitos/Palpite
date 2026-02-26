import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      username: dto.name,
    });

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: this.usersService.toPublic(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: this.usersService.toPublic(user),
      ...tokens,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const isValidRefreshToken = await this.usersService.validateRefreshToken(user, refreshToken);

    if (!isValidRefreshToken) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.usersService.toPublic(user);
  }

  private async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
