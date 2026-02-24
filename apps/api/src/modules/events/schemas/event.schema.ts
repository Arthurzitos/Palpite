import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EventCategory, EventStatus } from '@prediction-market/shared';

export type EventDocument = HydratedDocument<Event>;

@Schema({ _id: true })
export class Outcome {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  label: string;

  @Prop({ default: 0 })
  totalPool: number;

  @Prop({ default: 0 })
  odds: number;

  @Prop()
  color?: string;
}

export const OutcomeSchema = SchemaFactory.createForClass(Outcome);

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: EventCategory, required: true })
  category: EventCategory;

  @Prop()
  imageUrl?: string;

  @Prop({ type: String, enum: EventStatus, default: EventStatus.OPEN })
  status: EventStatus;

  @Prop({ type: [OutcomeSchema], required: true })
  outcomes: Outcome[];

  @Prop({ default: 0 })
  totalPool: number;

  @Prop({ type: Types.ObjectId })
  resolvedOutcomeId?: Types.ObjectId;

  @Prop()
  resolutionSource?: string;

  @Prop()
  startsAt?: Date;

  @Prop({ required: true })
  closesAt: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ status: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ closesAt: 1 });
EventSchema.index({ title: 'text', description: 'text' });
