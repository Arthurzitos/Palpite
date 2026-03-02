import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { UserRole } from '@prediction-market/shared';

async function seed() {
  console.log('Starting seed...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Create or update admin user
    const adminExists = await usersService.findByEmail('admin@prediction.local');
    if (!adminExists) {
      await usersService.create({
        email: 'admin@prediction.local',
        password: 'Admin123!',
        username: 'admin',
        role: UserRole.ADMIN,
        balance: 0,
      });
      console.log('Admin user created: admin@prediction.local / Admin123!');
    } else {
      // Ensure admin has the correct role
      if (adminExists.role !== UserRole.ADMIN) {
        await usersService.updateRole(adminExists._id.toString(), UserRole.ADMIN);
        console.log('Admin user role updated to ADMIN');
      } else {
        console.log('Admin user already exists with correct role');
      }
    }

    console.log('');
    console.log('Seed completed successfully!');
    console.log('');
    console.log('The application is ready for production use.');
    console.log('Login with: admin@prediction.local / Admin123!');
    console.log('');
    console.log('IMPORTANT: Change the admin password after first login!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();
