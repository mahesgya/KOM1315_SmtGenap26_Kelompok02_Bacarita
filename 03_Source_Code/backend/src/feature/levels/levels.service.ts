import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { ITransactionalService } from 'src/common/base-transaction/transactional.interface.service';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  StudentLevelResponseDTO,
  StudentStoryResponseDTO,
} from './dtos/student-level-response.dto';
import { LevelProgress } from './entities/level-progress.entity';
import { Level } from './entities/level.entity';
import { Story } from './entities/story.entity';
import { StoryMedal } from './enum/story-medal.enum';
import { StoryStatus } from './enum/story-status.enum';

@Injectable()
export class LevelsService extends ITransactionalService {
  constructor(
    dataSource: DataSource,

    private readonly logger: PinoLogger,

    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
    @InjectRepository(LevelProgress)
    private readonly levelProgressRepository: Repository<LevelProgress>,
  ) {
    super(dataSource);
    this.logger.setContext(LevelsService.name);
  }

  public async getLevels(): Promise<Level[]> {
    return this.levelRepository.find({
      relations: ['stories'],
      where: { isBonusLevel: false },
      order: {
        no: 'ASC',
        name: 'ASC',
      },
    });
  }

  public async getLevelByIdForStudentWithProgresses(
    studentId: string,
    levelId: number,
  ): Promise<StudentLevelResponseDTO> {
    return this.withTransaction<StudentLevelResponseDTO>(
      async (manager: EntityManager) => {
        const levelRepo: Repository<Level> = manager.getRepository(Level);
        const levelProgressRepo: Repository<LevelProgress> =
          manager.getRepository(LevelProgress);

        const level: Level | null = await levelRepo.findOne({
          where: { id: levelId },
          relations: [
            'stories',
            'stories.testSessions',
            'stories.testSessions.student',
            'levelProgresses',
          ],
          order: { no: 'ASC' },
        });
        if (!level) {
          throw new NotFoundException(
            `Level dengan id ${levelId} tidak ditemukan`,
          );
        }

        let levelProgress: LevelProgress;
        const existingProgresses: LevelProgress | null =
          await levelProgressRepo.findOne({
            where: { student_id: studentId, level_id: levelId },
            relations: ['level', 'level.stories'],
          });
        if (existingProgresses) {
          levelProgress = existingProgresses;
        } else {
          const newProgress: LevelProgress = levelProgressRepo.create({
            student_id: studentId,
            level_id: level.id,
            isUnlocked:
              level.no === 0 || level.no === 1 || level.no === 9999
                ? true
                : false,
          });
          newProgress.level = level;
          await levelProgressRepo.save(newProgress);
          levelProgress = newProgress;
        }

        const response: StudentLevelResponseDTO = {
          id: level.id,
          no: level.no,
          name: level.name,
          fullName: level.fullName,
          isUnlocked: levelProgress.isUnlocked,
          isSkipped: levelProgress.isSkipped,
          isBonusLevel: level.isBonusLevel,
          maxPoints: level.maxPoints,
          goldCount: levelProgress.goldCount,
          silverCount: levelProgress.silverCount,
          bronzeCount: levelProgress.bronzeCount,
          isCompleted: levelProgress.isCompleted,
          requiredPoints: levelProgress.requiredPoints,
          progress: levelProgress.progress,
          createdAt: level.createdAt,
          updatedAt: level.updatedAt,
          stories: level.stories
            .filter((story: Story) => story.status === StoryStatus.ACCEPTED)
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            )
            .map((story: Story) => {
              const storyResponse: StudentStoryResponseDTO = {
                id: story.id,
                title: story.title,
                description: story.description,
                imageUrl: story.imageUrl,
                isGoldMedal:
                  story.getHighestMedal(studentId) === StoryMedal.GOLD,
                isSilverMedal:
                  story.getHighestMedal(studentId) === StoryMedal.SILVER,
                isBronzeMedal:
                  story.getHighestMedal(studentId) === StoryMedal.BRONZE,
                createdAt: story.createdAt,
                updatedAt: story.updatedAt,
              };
              return storyResponse;
            }),
        };

        return response;
      },
    );
  }

  public async getLevelsForStudentWithProgresses(
    studentId: string,
  ): Promise<StudentLevelResponseDTO[]> {
    return this.withTransaction<StudentLevelResponseDTO[]>(
      async (manager: EntityManager) => {
        const levelRepo: Repository<Level> = manager.getRepository(Level);
        const levelProgressRepo: Repository<LevelProgress> =
          manager.getRepository(LevelProgress);

        const levels = await levelRepo.find({
          relations: [
            'stories',
            'stories.testSessions',
            'stories.testSessions.student',
            'levelProgresses',
          ],
          order: { no: 'ASC' },
        });

        const progressMap: Map<number, LevelProgress> = new Map<
          number,
          LevelProgress
        >();
        const progresses: LevelProgress[] = await levelProgressRepo.find({
          where: { student_id: studentId },
          relations: [
            'level',
            'level.stories',
            'level.stories.testSessions',
            'level.stories.testSessions.student',
          ],
        });

        for (const p of progresses) progressMap.set(p.level_id, p);

        const studentLevelsResponse: StudentLevelResponseDTO[] = [];

        for (const level of levels) {
          const progress = progressMap.get(level.id);
          if (!progress) {
            const newProgress: LevelProgress = levelProgressRepo.create({
              student_id: studentId,
              level_id: level.id,
              isUnlocked:
                level.no === 0 || level.no === 1 || level.no === 9999
                  ? true
                  : false,
            });
            newProgress.level = level;

            await levelProgressRepo.save(newProgress);
            progressMap.set(level.id, newProgress);
          }

          const levelProgress: LevelProgress = progressMap.get(level.id)!; // guaranteed to exist

          studentLevelsResponse.push({
            id: level.id,
            no: level.no,
            name: level.name,
            fullName: level.fullName,
            isUnlocked: levelProgress.isUnlocked,
            isSkipped: levelProgress.isSkipped,
            isBonusLevel: level.isBonusLevel,
            maxPoints: level.maxPoints,
            goldCount: levelProgress.goldCount,
            silverCount: levelProgress.silverCount,
            bronzeCount: levelProgress.bronzeCount,
            isCompleted: levelProgress.isCompleted,
            requiredPoints: levelProgress.requiredPoints,
            progress: levelProgress.progress,
            createdAt: level.createdAt,
            updatedAt: level.updatedAt,
            stories: level.stories
              .filter((story: Story) => story.status === StoryStatus.ACCEPTED)
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              )
              .map((story: Story) => {
                const storyResponse: StudentStoryResponseDTO = {
                  id: story.id,
                  title: story.title,
                  description: story.description,
                  imageUrl: story.imageUrl,
                  isGoldMedal:
                    story.getHighestMedal(studentId) === StoryMedal.GOLD,
                  isSilverMedal:
                    story.getHighestMedal(studentId) === StoryMedal.SILVER,
                  isBronzeMedal:
                    story.getHighestMedal(studentId) === StoryMedal.BRONZE,
                  createdAt: story.createdAt,
                  updatedAt: story.updatedAt,
                };
                return storyResponse;
              }),
          });
        }

        return studentLevelsResponse;
      },
    );
  }

  public async getLevelById(id: number): Promise<Level> {
    const level: Level | null = await this.levelRepository.findOne({
      where: { id },
      relations: ['stories'],
    });

    if (!level) {
      throw new NotFoundException(`Level dengan id ${id} tidak ditemukan`);
    }

    return level;
  }
}
