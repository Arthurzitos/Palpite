import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RakeRecordDocument = HydratedDocument<RakeRecord>;

export enum RakeStatus {
  PENDING = 'pending',
  AVAILABLE = 'available',
  WITHDRAWN = 'withdrawn',
}

@Schema({ timestamps: true })
export class RakeRecord {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  poolTotal: number;

  @Prop({ required: true })
  rakePercent: number;

  @Prop({ type: String, enum: RakeStatus, default: RakeStatus.AVAILABLE })
  status: RakeStatus;

  @Prop()
  withdrawnAt?: Date;

  @Prop()
  withdrawalReference?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const RakeRecordSchema = SchemaFactory.createForClass(RakeRecord);

RakeRecordSchema.index({ status: 1 });
RakeRecordSchema.index({ createdAt: -1 });
