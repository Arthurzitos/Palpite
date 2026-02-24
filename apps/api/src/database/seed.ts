import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { UserRole, EventCategory, EventStatus } from '@prediction-market/shared';
import { Event } from '../modules/events/schemas/event.schema';

async function seed() {
  console.log('Starting seed...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const eventModel = app.get<Model<Event>>(getModelToken(Event.name));

  try {
    // Create admin user
    let adminUser;
    const adminExists = await usersService.findByEmail('admin@prediction.local');
    if (!adminExists) {
      adminUser = await usersService.create({
        email: 'admin@prediction.local',
        password: 'Admin123!',
        username: 'admin',
        role: UserRole.ADMIN,
        balance: 10000,
      });
      console.log('Admin user created: admin@prediction.local / Admin123!');
    } else {
      adminUser = adminExists;
      console.log('Admin user already exists');
    }

    // Create test user
    const userExists = await usersService.findByEmail('user@prediction.local');
    if (!userExists) {
      await usersService.create({
        email: 'user@prediction.local',
        password: 'User123!',
        username: 'testuser',
        role: UserRole.USER,
        balance: 1000,
      });
      console.log('Test user created: user@prediction.local / User123!');
    } else {
      console.log('Test user already exists');
    }

    // Create second test user
    const user2Exists = await usersService.findByEmail('user2@prediction.local');
    if (!user2Exists) {
      await usersService.create({
        email: 'user2@prediction.local',
        password: 'User123!',
        username: 'testuser2',
        role: UserRole.USER,
        balance: 500,
      });
      console.log('Test user 2 created: user2@prediction.local / User123!');
    } else {
      console.log('Test user 2 already exists');
    }

    // Create sample events
    const existingEvents = await eventModel.countDocuments();
    if (existingEvents === 0) {
      const now = new Date();
      const futureDate = (days: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() + days);
        return date;
      };

      const sampleEvents = [
        {
          title: 'Bitcoin ultrapassa $150K antes de Julho 2026?',
          description: 'Este mercado será resolvido como SIM se o preço do Bitcoin (BTC) atingir ou ultrapassar $150.000 USD em qualquer exchange de referência (Binance, Coinbase, Kraken) antes de 1º de Julho de 2026.',
          category: EventCategory.CRYPTO,
          status: EventStatus.OPEN,
          outcomes: [
            { _id: new Types.ObjectId(), label: 'Sim', totalPool: 5000, odds: 1.8, color: '#22c55e' },
            { _id: new Types.ObjectId(), label: 'Não', totalPool: 4000, odds: 2.25, color: '#ef4444' },
          ],
          totalPool: 9000,
          closesAt: futureDate(120),
          createdBy: adminUser._id,
        },
        {
          title: 'Brasil vence a Copa do Mundo 2026?',
          description: 'Este mercado será resolvido como SIM se a seleção brasileira de futebol masculino vencer a Copa do Mundo FIFA 2026 nos EUA, México e Canadá.',
          category: EventCategory.SPORTS,
          status: EventStatus.OPEN,
          outcomes: [
            { _id: new Types.ObjectId(), label: 'Sim', totalPool: 3200, odds: 3.13, color: '#22c55e' },
            { _id: new Types.ObjectId(), label: 'Não', totalPool: 6800, odds: 1.47, color: '#ef4444' },
          ],
          totalPool: 10000,
          closesAt: futureDate(150),
          createdBy: adminUser._id,
        },
        {
          title: 'Lula será reeleito presidente em 2026?',
          description: 'Este mercado será resolvido como SIM se Luiz Inácio Lula da Silva vencer a eleição presidencial de 2026 no Brasil, seja no primeiro ou segundo turno.',
          category: EventCategory.POLITICS,
          status: EventStatus.OPEN,
          outcomes: [
            { _id: new Types.ObjectId(), label: 'Sim', totalPool: 6700, odds: 1.49, color: '#22c55e' },
            { _id: new Types.ObjectId(), label: 'Não', totalPool: 3300, odds: 3.03, color: '#ef4444' },
          ],
          totalPool: 10000,
          closesAt: futureDate(300),
          createdBy: adminUser._id,
        },
        {
          title: 'Fed corta juros para abaixo de 3% em 2026?',
          description: 'Este mercado será resolvido como SIM se o Federal Reserve dos EUA reduzir a taxa de juros federal (Fed Funds Rate) para abaixo de 3% até 31 de dezembro de 2026.',
          category: EventCategory.POLITICS,
          status: EventStatus.OPEN,
          outcomes: [
            { _id: new Types.ObjectId(), label: 'Sim', totalPool: 7800, odds: 1.28, color: '#22c55e' },
            { _id: new Types.ObjectId(), label: 'Não', totalPool: 2200, odds: 4.55, color: '#ef4444' },
          ],
          totalPool: 10000,
          closesAt: futureDate(180),
          createdBy: adminUser._id,
        },
        {
          title: 'SpaceX lança missão tripulada para Marte até 2028?',
          description: 'Este mercado será resolvido como SIM se a SpaceX realizar o lançamento de uma missão tripulada com destino a Marte até 31 de dezembro de 2028. A nave deve decolar com humanos a bordo.',
          category: EventCategory.OTHER,
          status: EventStatus.OPEN,
          outcomes: [
            { _id: new Types.ObjectId(), label: 'Sim', totalPool: 1500, odds: 6.67, color: '#22c55e' },
            { _id: new Types.ObjectId(), label: 'Não', totalPool: 8500, odds: 1.18, color: '#ef4444' },
          ],
          totalPool: 10000,
          closesAt: futureDate(700),
          createdBy: adminUser._id,
        },
        {
          title: 'Oscar 2027: filme brasileiro ganha Melhor Filme Internacional?',
          description: 'Este mercado será resolvido como SIM se um filme brasileiro vencer a categoria de Melhor Filme Internacional no Oscar 2027.',
          category: EventCategory.ENTERTAINMENT,
          status: EventStatus.OPEN,
          outcomes: [
            { _id: new Types.ObjectId(), label: 'Sim', totalPool: 800, odds: 6.25, color: '#22c55e' },
            { _id: new Types.ObjectId(), label: 'Não', totalPool: 4200, odds: 1.19, color: '#ef4444' },
          ],
          totalPool: 5000,
          closesAt: futureDate(400),
          createdBy: adminUser._id,
        },
        {
          title: 'Ethereum ultrapassa Bitcoin em market cap até 2027?',
          description: 'Este mercado será resolvido como SIM se o market cap do Ethereum (ETH) ultrapassar o market cap do Bitcoin (BTC) em qualquer momento até 31 de dezembro de 2027, conhecido como "The Flippening".',
          category: EventCategory.CRYPTO,
          status: EventStatus.OPEN,
          outcomes: [
            { _id: new Types.ObjectId(), label: 'Sim', totalPool: 2000, odds: 3.5, color: '#22c55e' },
            { _id: new Types.ObjectId(), label: 'Não', totalPool: 5000, odds: 1.4, color: '#ef4444' },
          ],
          totalPool: 7000,
          closesAt: futureDate(500),
          createdBy: adminUser._id,
        },
        {
          title: 'Flamengo vence a Libertadores 2026?',
          description: 'Este mercado será resolvido como SIM se o Clube de Regatas do Flamengo vencer a Copa Libertadores da América 2026.',
          category: EventCategory.SPORTS,
          status: EventStatus.OPEN,
          outcomes: [
            { _id: new Types.ObjectId(), label: 'Sim', totalPool: 4500, odds: 1.78, color: '#22c55e' },
            { _id: new Types.ObjectId(), label: 'Não', totalPool: 3500, odds: 2.29, color: '#ef4444' },
          ],
          totalPool: 8000,
          closesAt: futureDate(250),
          createdBy: adminUser._id,
        },
      ];

      for (const eventData of sampleEvents) {
        await eventModel.create(eventData);
        console.log(`Event created: ${eventData.title}`);
      }

      console.log(`${sampleEvents.length} sample events created`);
    } else {
      console.log(`${existingEvents} events already exist, skipping event creation`);
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();
