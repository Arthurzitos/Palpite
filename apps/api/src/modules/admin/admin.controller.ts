import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { SettlementService } from '../bets/services/settlement.service';
import { UsersService } from '../users/users.service';
import { BetsService } from '../bets/bets.service';
import { CreateEventDto, UpdateEventDto, ResolveEventDto, EventFiltersDto } from '../events/dto';
import { UserFiltersDto, UpdateUserDto, AdjustBalanceDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@prediction-market/shared';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly settlementService: SettlementService,
    private readonly usersService: UsersService,
    private readonly betsService: BetsService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    const stats = await this.eventsService.getEventStats();
    return stats;
  }

  @Get('events')
  async getAllEvents(@Query() filters: EventFiltersDto) {
    return this.eventsService.findAll(filters);
  }

  @Post('events')
  async createEvent(@Body() createEventDto: CreateEventDto, @CurrentUser() user: AuthUser) {
    return this.eventsService.create(createEventDto, user.userId);
  }

  @Patch('events/:id')
  async updateEvent(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Post('events/:id/lock')
  async lockEvent(@Param('id') id: string) {
    return this.eventsService.lockEvent(id);
  }

  @Post('events/:id/resolve')
  async resolveEvent(@Param('id') id: string, @Body() resolveDto: ResolveEventDto) {
    return this.settlementService.resolveEvent(id, resolveDto);
  }

  @Post('events/:id/cancel')
  async cancelEvent(@Param('id') id: string) {
    return this.settlementService.cancelEvent(id);
  }

  // User Management Endpoints
  @Get('users')
  async getAllUsers(@Query() filters: UserFiltersDto) {
    return this.usersService.findAll(filters);
  }

  @Get('users/stats')
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return this.usersService.toAdminView(user);
  }

  @Get('users/:id/bets')
  async getUserBets(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.betsService.findByUser(id, { page: page || 1, limit: limit || 20 });
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    if (updateUserDto.role) {
      const user = await this.usersService.updateRole(id, updateUserDto.role);
      return this.usersService.toAdminView(user);
    }
    const user = await this.usersService.findById(id);
    return this.usersService.toAdminView(user);
  }

  @Post('users/:id/adjust-balance')
  async adjustUserBalance(@Param('id') id: string, @Body() adjustBalanceDto: AdjustBalanceDto) {
    const user = await this.usersService.adjustBalance(
      id,
      adjustBalanceDto.amount,
      adjustBalanceDto.operation,
      adjustBalanceDto.reason,
    );
    return this.usersService.toAdminView(user);
  }
}
