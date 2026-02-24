import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlatformWalletDocument = HydratedDocument<PlatformWallet>;

@Schema({ timestamps: true })
export class PlatformWallet {
  @Prop({ required: true, unique: true, default: 'main' })
  walletId: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  totalEarned: number;

  @Prop({ default: 0 })
  totalWithdrawn: number;

  @Prop({ default: 0 })
  pendingWithdrawal: number;

  createdAt: Date;
  updatedAt: Date;
}

export const PlatformWalletSchema = SchemaFactory.createForClass(PlatformWallet);
