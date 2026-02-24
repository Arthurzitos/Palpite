import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { SettlementService } from '../bets/services/settlement.service';
import { CreateEventDto, UpdateEventDto, ResolveEventDto, EventFiltersDto } from '../events/dto';
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
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.eventsService.create(createEventDto, user.userId);
  }

  @Patch('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Post('events/:id/lock')
  async lockEvent(@Param('id') id: string) {
    return this.eventsService.lockEvent(id);
  }

  @Post('events/:id/resolve')
  async resolveEvent(
    @Param('id') id: string,
    @Body() resolveDto: ResolveEventDto,
  ) {
    return this.settlementService.resolveEvent(id, resolveDto);
  }

  @Post('events/:id/cancel')
  async cancelEvent(@Param('id') id: string) {
    return this.settlementService.cancelEvent(id);
  }
}
