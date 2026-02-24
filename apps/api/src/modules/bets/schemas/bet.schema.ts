import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BetStatus } from '@prediction-market/shared';

export type BetDocument = HydratedDocument<Bet>;

@Schema({ timestamps: true })
export class Bet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  outcomeId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, min: 0 })
  oddsAtPurchase: number;

  @Prop({ required: true, min: 0 })
  potentialPayout: number;

  @Prop({ type: String, enum: BetStatus, default: BetStatus.ACTIVE })
  status: BetStatus;

  @Prop({ default: 0 })
  payout: number;

  @Prop()
  settledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const BetSchema = SchemaFactory.createForClass(Bet);

BetSchema.index({ userId: 1, status: 1 });
BetSchema.index({ eventId: 1, status: 1 });
BetSchema.index({ eventId: 1, outcomeId: 1 });
BetSchema.index({ createdAt: -1 });
