import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelProgress } from './entities/level-progress.entity';
import { Level } from './entities/level.entity';
import { Story } from './entities/story.entity';
import { LevelsController } from './levels.controller';
import { LevelsService } from './levels.service';
import { LevelsStudentController } from './levels-student.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Level, LevelProgress, Story]),
  ],
  controllers: [LevelsController, LevelsStudentController],
  providers: [LevelsService],
})
export class LevelsModule {}
