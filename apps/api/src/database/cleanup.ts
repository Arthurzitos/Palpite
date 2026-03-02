import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { Event } from '../modules/events/schemas/event.schema';
import { Bet } from '../modules/bets/schemas/bet.schema';
import { Transaction } from '../modules/transactions/schemas/transaction.schema';
import { RakeRecord } from '../modules/rake/schemas/rake-record.schema';
import { PlatformWallet } from '../modules/rake/schemas/platform-wallet.schema';
import { User } from '../modules/users/schemas/user.schema';

async function cleanup() {
  console.log('Starting database cleanup...');
  console.log('⚠️  This will delete ALL events, bets, transactions, and test users!');
  console.log('');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get all models
    const eventModel = app.get<Model<Event>>(getModelToken(Event.name));
    const betModel = app.get<Model<Bet>>(getModelToken(Bet.name));
    const transactionModel = app.get<Model<Transaction>>(getModelToken(Transaction.name));
    const rakeRecordModel = app.get<Model<RakeRecord>>(getModelToken(RakeRecord.name));
    const platformWalletModel = app.get<Model<PlatformWallet>>(getModelToken(PlatformWallet.name));
    const userModel = app.get<Model<User>>(getModelToken(User.name));

    // Delete all bets
    const betsDeleted = await betModel.deleteMany({});
    console.log(`✓ Deleted ${betsDeleted.deletedCount} bets`);

    // Delete all events
    const eventsDeleted = await eventModel.deleteMany({});
    console.log(`✓ Deleted ${eventsDeleted.deletedCount} events`);

    // Delete all transactions
    const transactionsDeleted = await transactionModel.deleteMany({});
    console.log(`✓ Deleted ${transactionsDeleted.deletedCount} transactions`);

    // Delete all rake records
    const rakeRecordsDeleted = await rakeRecordModel.deleteMany({});
    console.log(`✓ Deleted ${rakeRecordsDeleted.deletedCount} rake records`);

    // Reset platform wallet
    await platformWalletModel.deleteMany({});
    console.log('✓ Reset platform wallet');

    // Delete test users (keep only admin)
    const testUsersDeleted = await userModel.deleteMany({
      email: { $ne: 'admin@prediction.local' },
    });
    console.log(`✓ Deleted ${testUsersDeleted.deletedCount} test users`);

    // Reset admin balance to 0 (clean start)
    await userModel.updateOne(
      { email: 'admin@prediction.local' },
      { $set: { balance: 0 } }
    );
    console.log('✓ Reset admin balance to 0');

    console.log('');
    console.log('Database cleanup completed successfully!');
    console.log('');
    console.log('The application is now clean and ready for production use.');
    console.log('Admin credentials: admin@prediction.local / Admin123!');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

cleanup();
