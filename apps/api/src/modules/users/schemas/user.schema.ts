import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '@prediction-market/shared';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  totalDeposited: number;

  @Prop({ default: 0 })
  totalWithdrawn: number;

  @Prop({ default: 0 })
  totalWagered: number;

  @Prop({ default: 0 })
  totalWon: number;

  @Prop()
  refreshToken?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
