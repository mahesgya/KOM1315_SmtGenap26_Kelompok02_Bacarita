import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level } from 'src/feature/levels/entities/level.entity';
import { Story } from 'src/feature/levels/entities/story.entity';
import { DatabaseSeederController } from './database-seeder.controller';
import { DatabaseSeederService } from './database-seeder.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Level, Story])],
  controllers: [DatabaseSeederController],
  providers: [DatabaseSeederService],
})
export class DatabaseSeederModule {}
