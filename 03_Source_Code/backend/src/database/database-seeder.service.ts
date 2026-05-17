import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AdminSeeder } from './seeders/admin.seeder';
import { CuratorSeeder } from './seeders/curator.seeder';
import { LevelSeeder } from './seeders/level.seeder';

@Injectable()
export class DatabaseSeederService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async seedAll(): Promise<{ message: string; success: boolean }> {
    try {
      await new AdminSeeder(this.dataSource, this.configService).run();
      await new CuratorSeeder(this.dataSource, this.configService).run();
      await new LevelSeeder(this.dataSource).run();

      return {
        success: true,
        message: 'Database seeding completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async seedLevels(): Promise<{ message: string; success: boolean }> {
    try {
      await new LevelSeeder(this.dataSource).run();

      return {
        success: true,
        message: 'Levels and stories seeded successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Level seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async seedAdmins(): Promise<{ message: string; success: boolean }> {
    try {
      await new AdminSeeder(this.dataSource, this.configService).run();

      return {
        success: true,
        message: 'Admins seeded successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Admin seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async seedCurators(): Promise<{ message: string; success: boolean }> {
    try {
      await new CuratorSeeder(this.dataSource, this.configService).run();

      return {
        success: true,
        message: 'Curators seeded successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Curator seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
