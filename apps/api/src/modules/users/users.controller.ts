import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    const userData = await this.usersService.findById(user.userId);
    return this.usersService.toPublic(userData);
  }

  @Get('balance')
  async getBalance(@CurrentUser() user: CurrentUserPayload) {
    const balance = await this.usersService.getBalance(user.userId);
    return { balance };
  }
}
