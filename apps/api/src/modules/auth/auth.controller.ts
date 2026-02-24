import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    // In a real app, you'd decode the refresh token to get the userId
    // For simplicity, we require the user to be authenticated
    // This is a simplified version
    const decoded = this.decodeRefreshToken(dto.refreshToken);
    return this.authService.refresh(decoded.sub, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logout(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getMe(user.userId);
  }

  private decodeRefreshToken(token: string): { sub: string } {
    try {
      const base64Payload = token.split('.')[1];
      if (!base64Payload) {
        throw new Error('Invalid token');
      }
      const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
      return JSON.parse(payload) as { sub: string };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }
}
