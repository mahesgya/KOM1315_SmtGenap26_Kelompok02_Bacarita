import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenGeneratorModule } from 'src/common/token-generator/token-generator.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { LevelProgress } from '../levels/entities/level-progress.entity';
import { Level } from '../levels/entities/level.entity';
import { Story } from '../levels/entities/story.entity';
import { StudentModule } from '../users/student/student.module';
import { DistractedEyeEvent } from './entities/distracted-eye-event.entity';
import { DistractedEyeEventsSummary } from './entities/distracted-eye-events-summary.entity';
import { STTWordResult } from './entities/stt-word-result.entity';
import { TestSession } from './entities/test-session.entity';
import { StudentTestSessionController } from './test-session-student.controller';
import { TestSessionService } from './test-session.service';

@Module({
  imports: [
    AiModule,

    AuthModule,

    TypeOrmModule.forFeature([
      TestSession,
      Level,
      LevelProgress,
      Story,
      STTWordResult,
      DistractedEyeEvent,
      DistractedEyeEventsSummary,
    ]),

    StudentModule,

    TokenGeneratorModule,
  ],
  controllers: [StudentTestSessionController],
  providers: [TestSessionService],
})
export class TestSessionModule {}
