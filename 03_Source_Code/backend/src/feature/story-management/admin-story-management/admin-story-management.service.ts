import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { join } from 'path';
import { Level } from 'src/feature/levels/entities/level.entity';
import { StoryApprovalLog } from 'src/feature/levels/entities/story-approval-log.entity';
import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryStatus } from 'src/feature/levels/enum/story-status.enum';
import { Repository } from 'typeorm';
import {
  LevelDTO,
  LevelsOverviewDTO,
  LevelWithStoriesDTO,
  StoryDTO,
} from './dtos/admin-story-management.dto';
import { CreateStoryDTO } from './dtos/create-story.dto';
import { UpdateStoryDTO } from './dtos/update-story.dto';

const SUPPORTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const SUPPORTED_IMAGE_MIME_TYPES_STRING = SUPPORTED_IMAGE_MIME_TYPES.join(', ');

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024); // in MB

@Injectable()
export class AdminStoryManagementService {
  private readonly logger = new Logger(AdminStoryManagementService.name);

  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(StoryApprovalLog)
    private readonly storyApprovalLogRepository: Repository<StoryApprovalLog>,
  ) {}

  public async getOverview(): Promise<LevelsOverviewDTO> {
    const levels: Level[] = await this.levelRepository.find({
      order: { no: 'ASC' },
    });

    const storiesCount: number = await this.storyRepository.count();

    const levelDTOs: LevelDTO[] = await Promise.all(
      levels.map(async (level: Level) => ({
        id: level.id,
        no: level.no,
        name: level.name,
        fullName: level.fullName,
        storyCount: await this.storyRepository.count({
          where: { level: { id: level.id } },
        }),
        createdAt: level.createdAt,
        updatedAt: level.updatedAt,
      })),
    );

    const levelsOverviewDTO: LevelsOverviewDTO = {
      levels: levelDTOs,
      levelsCount: levels.length,
      storiesCount,
    };

    return levelsOverviewDTO;
  }

  public async getStoriesForLevel(
    levelId: number,
  ): Promise<LevelWithStoriesDTO> {
    const level: Level | null = await this.levelRepository.findOne({
      where: { id: levelId },
      relations: [
        'stories',
        'stories.approvalLogs',
        'stories.approvalLogs.curator',
      ],
      order: { no: 'ASC' },
    });

    if (!level) {
      throw new NotFoundException(`Level ${levelId} tidak ditemukan.`);
    }

    const storyDTOs: StoryDTO[] = level.stories.map((story: Story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      image: story.image,
      imageUrl: story.imageUrl,
      passage: story.passage,
      sentences: story.passageSentences,
      status: story.status,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      approvalLogs: story.approvalLogs?.map((log) => ({
        id: log.id,
        storyId: story.id,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        reason: log.reason,
        curatorId: log.curator?.id ?? null,
        curatorName: log.curator
          ? `${log.curator.fullName} ${log.curator.fullName}`
          : null,
        createdAt: log.createdAt,
      })),
    }));

    const levelWithStoriesDTO: LevelWithStoriesDTO = {
      id: level.id,
      no: level.no,
      name: level.name,
      fullName: level.fullName,
      createdAt: level.createdAt,
      updatedAt: level.updatedAt,
      stories: storyDTOs,
    };

    return levelWithStoriesDTO;
  }

  public async createStory(
    createStoryDTO: CreateStoryDTO,
    levelId: number,
    imageCover: Express.Multer.File,
  ): Promise<StoryDTO> {
    const level: Level | null = await this.levelRepository.findOne({
      where: { id: levelId },
    });

    if (!level) {
      throw new NotFoundException(`Level ${levelId} tidak ditemukan.`);
    }

    const imageCoverPath: string = `/public/story-images/${imageCover.filename}`;

    const story: Story = this.storyRepository.create({
      level: level,
      title: createStoryDTO.title,
      image: imageCoverPath,
      description: createStoryDTO.description,
      passage: createStoryDTO.passage,
      status: StoryStatus.WAITING,
    });

    const savedStory: Story = await this.storyRepository.save(story);

    return {
      id: savedStory.id,
      title: savedStory.title,
      description: savedStory.description,
      image: savedStory.image,
      imageUrl: savedStory.imageUrl,
      passage: savedStory.passage,
      sentences: savedStory.passageSentences,
      status: savedStory.status,
      createdAt: savedStory.createdAt,
      updatedAt: savedStory.updatedAt,
    } as StoryDTO;
  }

  public validateStoryImageCover(imageCover: Express.Multer.File): void {
    if (!imageCover) {
      throw new BadRequestException(
        'Gagal, Gambar cover cerita wajib diunggah.',
      );
    }

    if (imageCover.size > MAX_IMAGE_SIZE_BYTES) {
      this.deleteStoryImageFromDisk(
        `/public/story-images/${imageCover.filename}`,
      );
      throw new BadRequestException(
        `Gagal, Ukuran gambar cover maksimal ${MAX_IMAGE_SIZE_MB} MB.`,
      );
    }

    if (!SUPPORTED_IMAGE_MIME_TYPES.includes(imageCover.mimetype)) {
      this.deleteStoryImageFromDisk(
        `/public/story-images/${imageCover.filename}`,
      );
      throw new BadRequestException(
        `Gagal, File gambar harus berformat: ${SUPPORTED_IMAGE_MIME_TYPES_STRING}`,
      );
    }
  }

  public async updateStory(
    storyId: number,
    updateStoryDTO: UpdateStoryDTO,
    imageCover?: Express.Multer.File,
  ): Promise<StoryDTO> {
    const story: Story | null = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(
        `Cerita dengan ID ${storyId} tidak ditemukan.`,
      );
    }

    // Update fields if provided
    if (updateStoryDTO.title !== undefined) {
      story.title = updateStoryDTO.title;
    }

    if (updateStoryDTO.description !== undefined) {
      story.description = updateStoryDTO.description;
    }

    if (updateStoryDTO.passage !== undefined) {
      story.passage = updateStoryDTO.passage;
    }

    // Handle image update
    if (imageCover) {
      // Delete old image if exists
      if (story.image) {
        this.deleteStoryImageFromDisk(story.image);
      }

      // Set new image path
      story.image = `/public/story-images/${imageCover.filename}`;
    }

    const approvalLog: StoryApprovalLog =
      this.storyApprovalLogRepository.create({
        story: story,
        fromStatus: story.status,
        toStatus: StoryStatus.WAITING,
        reason: 'Cerita diperbarui oleh admin.',
        curator: null,
      });
    story.status = StoryStatus.WAITING; // Reset status to WAITING upon update
    const savedStory: Story = await this.storyRepository.save(story);

    await this.storyApprovalLogRepository.save(approvalLog);

    return {
      id: savedStory.id,
      title: savedStory.title,
      description: savedStory.description,
      image: savedStory.image,
      imageUrl: savedStory.imageUrl,
      passage: savedStory.passage,
      sentences: savedStory.passageSentences,
      status: StoryStatus.WAITING,
      createdAt: savedStory.createdAt,
      updatedAt: savedStory.updatedAt,
    } as StoryDTO;
  }

  public async deleteStory(storyId: number): Promise<void> {
    const story: Story | null = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(
        `Cerita dengan ID ${storyId} tidak ditemukan.`,
      );
    }

    // Delete image from disk if exists
    if (story.image) {
      this.deleteStoryImageFromDisk(story.image);
    }

    await this.storyRepository.remove(story);
  }

  private deleteStoryImageFromDisk(imagePath: string): void {
    try {
      // imagePath is "/public/story-images/filename.jpg"
      // We need to convert it to actual file system path
      const relativePath = imagePath.startsWith('/')
        ? imagePath.substring(1)
        : imagePath;
      const absolutePath = join(process.cwd(), relativePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete image at ${imagePath}:`, error);
    }
  }
}
