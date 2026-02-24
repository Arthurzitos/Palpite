import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RakeRecord, RakeRecordSchema } from './schemas/rake-record.schema';
import { PlatformWallet, PlatformWalletSchema } from './schemas/platform-wallet.schema';
import { RakeService } from './rake.service';
import { RakeController } from './rake.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RakeRecord.name, schema: RakeRecordSchema },
      { name: PlatformWallet.name, schema: PlatformWalletSchema },
    ]),
    forwardRef(() => WalletModule),
  ],
  controllers: [RakeController],
  providers: [RakeService],
  exports: [RakeService],
})
export class RakeModule {}
