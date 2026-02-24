import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { EventFiltersDto } from './dto';
import { Public } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Public()
  async findAll(@Query() filters: EventFiltersDto) {
    return this.eventsService.findAll(filters);
  }

  @Get('featured')
  @Public()
  async getFeatured() {
    return this.eventsService.findFeatured();
  }

  @Get('categories')
  @Public()
  async getCategories() {
    return this.eventsService.getCategoriesWithCount();
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }
}
