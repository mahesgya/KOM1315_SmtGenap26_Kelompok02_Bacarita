/* eslint-disable no-console */
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { DataSource } from 'typeorm'; // adjust to your config file
import { connectionSource } from 'src/config/database/typeorm.config';
import { LevelSeeder } from './seeders/level.seeder';
import { AdminSeeder } from './seeders/admin.seeder';
import { CuratorSeeder } from './seeders/curator.seeder';

async function runSeeders(): Promise<void> {
  const dataSource: DataSource = connectionSource;

  await dataSource.initialize();
  console.log('Database connected.');

  // Create NestJS application to access ConfigService
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);

  await new LevelSeeder(dataSource).run();
  await new AdminSeeder(dataSource, configService).run();
  await new CuratorSeeder(dataSource, configService).run();

  await app.close();
  await dataSource.destroy();
  console.log('Seeding completed.');
}

runSeeders().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
