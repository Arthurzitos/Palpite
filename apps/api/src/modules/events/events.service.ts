import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { OddsService } from './services/odds.service';
import { CreateEventDto, UpdateEventDto, ResolveEventDto, EventFiltersDto } from './dto';
import { EventStatus } from '@prediction-market/shared';

export interface PaginatedEvents {
  events: EventDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    private oddsService: OddsService,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string): Promise<EventDocument> {
    const closesAt = new Date(createEventDto.closesAt);
    if (closesAt <= new Date()) {
      throw new BadRequestException('Close date must be in the future');
    }

    const outcomes = createEventDto.outcomes.map((outcome) => ({
      _id: new Types.ObjectId(),
      label: outcome.label,
      totalPool: 0,
      odds: 0,
      color: outcome.color,
    }));

    const event = new this.eventModel({
      ...createEventDto,
      outcomes,
      startsAt: createEventDto.startsAt ? new Date(createEventDto.startsAt) : undefined,
      closesAt,
      createdBy: new Types.ObjectId(userId),
    });

    return event.save();
  }

  async findAll(filters: EventFiltersDto): Promise<PaginatedEvents> {
    const query: FilterQuery<Event> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Handle special filters
    if (filters.filter === 'live') {
      // Live events: already started but still open
      query.status = EventStatus.OPEN;
      query.startsAt = { $lte: new Date() };
      query.closesAt = { $gt: new Date() };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Determine sort order based on filter
    let sort: Record<string, 1 | -1> = { closesAt: 1, createdAt: -1 };
    if (filters.filter === 'trending' || filters.filter === 'popular') {
      // Sort by volume (most active first)
      sort = { totalPool: -1, closesAt: 1 };
    } else if (filters.filter === 'new') {
      // Sort by creation date (newest first)
      sort = { createdAt: -1 };
    }

    const [events, total] = await Promise.all([
      this.eventModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.eventModel.countDocuments(query).exec(),
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOpen(limit = 20): Promise<EventDocument[]> {
    return this.eventModel
      .find({
        status: EventStatus.OPEN,
        closesAt: { $gt: new Date() },
      })
      .sort({ totalPool: -1, closesAt: 1 })
      .limit(limit)
      .exec();
  }

  async findFeatured(limit = 6): Promise<EventDocument[]> {
    return this.eventModel
      .find({
        status: EventStatus.OPEN,
        closesAt: { $gt: new Date() },
      })
      .sort({ totalPool: -1 })
      .limit(limit)
      .exec();
  }

  async findById(id: string): Promise<EventDocument> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<EventDocument> {
    const event = await this.findById(id);

    if (event.status !== EventStatus.OPEN) {
      throw new ConflictException('Cannot update a non-open event');
    }

    if (updateEventDto.closesAt) {
      const closesAt = new Date(updateEventDto.closesAt);
      if (closesAt <= new Date()) {
        throw new BadRequestException('Close date must be in the future');
      }
    }

    const updateData: Record<string, unknown> = { ...updateEventDto };
    if (updateEventDto.startsAt) {
      updateData.startsAt = new Date(updateEventDto.startsAt);
    }
    if (updateEventDto.closesAt) {
      updateData.closesAt = new Date(updateEventDto.closesAt);
    }

    const updated = await this.eventModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (!updated) {
      throw new NotFoundException('Event not found');
    }

    return updated;
  }

  async lockEvent(id: string): Promise<EventDocument> {
    const event = await this.findById(id);

    if (event.status !== EventStatus.OPEN) {
      throw new ConflictException('Event is not open');
    }

    event.status = EventStatus.LOCKED;
    return event.save();
  }

  async cancelEvent(id: string): Promise<EventDocument> {
    const event = await this.findById(id);

    if (event.status === EventStatus.RESOLVED || event.status === EventStatus.CANCELLED) {
      throw new ConflictException('Event is already resolved or cancelled');
    }

    event.status = EventStatus.CANCELLED;
    return event.save();
  }

  async getCategoriesWithCount(): Promise<CategoryCount[]> {
    const result = await this.eventModel.aggregate([
      { $match: { status: EventStatus.OPEN } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    return result;
  }

  async addBetToOutcome(
    eventId: string,
    outcomeId: string,
    amount: number,
  ): Promise<EventDocument> {
    const event = await this.eventModel.findOneAndUpdate(
      {
        _id: eventId,
        status: EventStatus.OPEN,
        'outcomes._id': new Types.ObjectId(outcomeId),
      },
      {
        $inc: {
          totalPool: amount,
          'outcomes.$.totalPool': amount,
        },
      },
      { new: true },
    );

    if (!event) {
      throw new NotFoundException('Event or outcome not found, or event is not open');
    }

    // Recalculate odds for all outcomes
    const updatedOutcomes = this.oddsService.recalculateAllOdds(event.outcomes, event.totalPool);

    event.outcomes = updatedOutcomes as typeof event.outcomes;
    return event.save();
  }

  async getOutcome(eventId: string, outcomeId: string) {
    const event = await this.findById(eventId);
    const outcome = event.outcomes.find((o) => o._id.toString() === outcomeId);

    if (!outcome) {
      throw new NotFoundException('Outcome not found');
    }

    return { event, outcome };
  }

  async markAsResolved(eventId: string, resolveDto: ResolveEventDto): Promise<EventDocument> {
    const event = await this.findById(eventId);

    if (event.status !== EventStatus.OPEN && event.status !== EventStatus.LOCKED) {
      throw new ConflictException('Event cannot be resolved in current state');
    }

    const outcomeExists = event.outcomes.some((o) => o._id.toString() === resolveDto.outcomeId);

    if (!outcomeExists) {
      throw new BadRequestException('Invalid outcome ID');
    }

    event.status = EventStatus.RESOLVED;
    event.resolvedOutcomeId = new Types.ObjectId(resolveDto.outcomeId);
    event.resolutionSource = resolveDto.resolutionSource;
    event.resolvedAt = new Date();

    return event.save();
  }

  async getEventStats() {
    const [totalEvents, openEvents, totalVolume] = await Promise.all([
      this.eventModel.countDocuments().exec(),
      this.eventModel.countDocuments({ status: EventStatus.OPEN }).exec(),
      this.eventModel.aggregate([{ $group: { _id: null, total: { $sum: '$totalPool' } } }]),
    ]);

    return {
      totalEvents,
      openEvents,
      totalVolume: totalVolume[0]?.total || 0,
    };
  }
}
