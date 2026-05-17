import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoryApprovalLog } from 'src/feature/levels/entities/story-approval-log.entity';
import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';
import { Curator } from 'src/feature/users/entities/curator.entity';
import { In, Repository } from 'typeorm';
import { ApproveStoryDTO } from './dtos/approve-story.dto';
import {
  ApprovalLogDTO,
  StoriesForApprovalListDTO,
  StoryForApprovalDTO,
  StoryWithApprovalLogsDTO,
} from './dtos/curator-story-approval.dto';

@Injectable()
export class CuratorStoryApprovalService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(StoryApprovalLog)
    private readonly storyApprovalLogRepository: Repository<StoryApprovalLog>,
  ) {}

  public async getStoriesForApproval(): Promise<StoriesForApprovalListDTO> {
    const stories: Story[] = await this.storyRepository.find({
      where: {
        status: In([StoryStatus.WAITING]),
      },
      relations: ['level'],
      order: { level: { no: 'ASC' }, createdAt: 'ASC' },
    });

    const storyDTOs: StoryForApprovalDTO[] = stories.map(
      (story: Story): StoryForApprovalDTO => ({
        id: story.id,
        title: story.title,
        description: story.description,
        image: story.image,
        imageUrl: story.imageUrl,
        passage: story.passage,
        sentences: story.passageSentences,
        status: story.status,
        levelId: story.level?.id,
        levelName: story.level?.name,
        levelFullName: story.level?.fullName,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      }),
    );

    return {
      stories: storyDTOs,
      totalWaiting: stories.length,
    };
  }

  public async getStoryDetail(
    storyId: number,
  ): Promise<StoryWithApprovalLogsDTO> {
    const story: Story | null = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['level'],
    });

    if (!story) {
      throw new NotFoundException(
        `Cerita dengan ID ${storyId} tidak ditemukan.`,
      );
    }

    const approvalLogs: StoryApprovalLog[] =
      await this.storyApprovalLogRepository.find({
        where: { story: { id: storyId } },
        relations: ['curator'],
        order: { createdAt: 'DESC' },
      });

    const approvalLogDTOs: ApprovalLogDTO[] = approvalLogs.map(
      (log: StoryApprovalLog): ApprovalLogDTO => ({
        id: log.id,
        storyId: story.id,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        reason: log.reason,
        curatorId: log.curator?.id ?? null,
        curatorName: log.curator?.fullName ?? null,
        createdAt: log.createdAt,
      }),
    );

    const storyDTO: StoryForApprovalDTO = {
      id: story.id,
      title: story.title,
      description: story.description,
      image: story.image,
      imageUrl: story.imageUrl,
      passage: story.passage,
      sentences: story.passageSentences,
      status: story.status,
      levelId: story.level?.id,
      levelName: story.level?.name,
      levelFullName: story.level?.fullName,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    };

    return {
      ...storyDTO,
      approvalLogs: approvalLogDTOs,
    };
  }

  public async approveOrRejectStory(
    storyId: number,
    approveStoryDTO: ApproveStoryDTO,
    curator: Curator,
  ): Promise<StoryWithApprovalLogsDTO> {
    const story: Story | null = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['level'],
    });

    if (!story) {
      throw new NotFoundException(
        `Cerita dengan ID ${storyId} tidak ditemukan.`,
      );
    }

    const fromStatus = story.status;
    const toStatus = approveStoryDTO.status;

    if (fromStatus === toStatus) {
      throw new BadRequestException(
        `Cerita dengan ID ${storyId} sudah berada pada status ${toStatus}.`,
      );
    }

    const approvalLog: StoryApprovalLog =
      this.storyApprovalLogRepository.create({
        story: story,
        fromStatus: fromStatus,
        toStatus: toStatus,
        reason: approveStoryDTO.reason ?? null,
        curator: curator,
      });

    await this.storyApprovalLogRepository.save(approvalLog);

    story.status = toStatus;
    await this.storyRepository.save(story);

    return this.getStoryDetail(storyId);
  }
}
