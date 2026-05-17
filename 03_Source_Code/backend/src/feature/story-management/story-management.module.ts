import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { StoryApprovalLog } from '../levels/entities/story-approval-log.entity';
import { Level } from '../levels/entities/level.entity';
import { Story } from '../levels/entities/story.entity';
import { CuratorModule } from '../users/curator/curator.module';
import { AdminStoryManagementController } from './admin-story-management/admin-story-management.controller';
import { AdminStoryManagementService } from './admin-story-management/admin-story-management.service';
import { CuratorStoryApprovalController } from './curator-story-approval/curator-story-approval.controller';
import { CuratorStoryApprovalService } from './curator-story-approval/curator-story-approval.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Level, Story, StoryApprovalLog]),
    AuthModule,
    CuratorModule,
  ],
  controllers: [AdminStoryManagementController, CuratorStoryApprovalController],
  providers: [AdminStoryManagementService, CuratorStoryApprovalService],
})
export class StoryManagementModule {}
