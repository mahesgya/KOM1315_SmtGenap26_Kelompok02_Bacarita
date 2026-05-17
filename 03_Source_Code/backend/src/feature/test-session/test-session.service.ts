import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { ITransactionalService } from 'src/common/base-transaction/transactional.interface.service';
import { TokenGeneratorService } from 'src/common/token-generator/token-generator.service';
import { DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { OpenRouterService } from '../ai/open-router.service';
import { LevelProgress } from '../levels/entities/level-progress.entity';
import { Level } from '../levels/entities/level.entity';
import { Story } from '../levels/entities/story.entity';
import { StoryMedal } from '../levels/enum/story-medal.enum';
import { Student } from '../users/entities/student.entity';
import { StudentService } from '../users/student/student.service';
import { AnswerSTTQuestionDTO } from './dtos/answer-stt-question.dto';
import { CreateDistractionEventDTO } from './dtos/create-distraction-event.dto';
import { CreateDistractionSummaryDTO } from './dtos/create-distraction-summary.dto';
import { DistractionEventResponseDTO } from './dtos/distraction-event-response.dto';
import { DistractionSummaryResponseDTO } from './dtos/distraction-summary-response.dto';
import { STTAnsweredQuestionDTO } from './dtos/stt-answered-question.dto';
import { STTQuestionResponseDTO } from './dtos/stt-question-response.dto';
import { TestSessionResponseDTO } from './dtos/test-session-response.dto';
import { DistractedEyeEvent } from './entities/distracted-eye-event.entity';
import { DistractedEyeEventsSummary } from './entities/distracted-eye-events-summary.entity';
import { STTWordResult } from './entities/stt-word-result.entity';
import { TestSession } from './entities/test-session.entity';

@Injectable()
export class TestSessionService extends ITransactionalService {
  constructor(
    dataSource: DataSource,

    private readonly logger: PinoLogger,

    private readonly openRouterService: OpenRouterService,

    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,

    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,

    private readonly studentService: StudentService,

    @InjectRepository(STTWordResult)
    private readonly sttWordResultRepository: Repository<STTWordResult>,

    @InjectRepository(TestSession)
    private readonly testSessionRepository: Repository<TestSession>,

    @InjectRepository(DistractedEyeEvent)
    private readonly distractedEyeEventRepository: Repository<DistractedEyeEvent>,

    @InjectRepository(DistractedEyeEventsSummary)
    private readonly distractedEyeEventsSummaryRepository: Repository<DistractedEyeEventsSummary>,

    private readonly tokenGeneratorService: TokenGeneratorService,
  ) {
    super(dataSource);
    this.logger.setContext(TestSessionService.name);
  }

  public async startNewTestSession(
    studentId: string,
    storyId: number,
  ): Promise<TestSessionResponseDTO> {
    return this.withTransaction<TestSessionResponseDTO>(
      async (manager: EntityManager) => {
        const storyRepo: Repository<Story> = manager.getRepository(Story);
        const testSessionRepo: Repository<TestSession> =
          manager.getRepository(TestSession);

        const currentStudent: Student | null =
          await this.studentService.findById(studentId);
        if (!currentStudent) {
          throw new NotFoundException(
            `Siswa dengan ID ${studentId} tidak ditemukan`,
          );
        }

        const currentStory: Story | null = await storyRepo.findOne({
          where: { id: storyId },
          relations: [
            'level',
            'level.levelProgresses',
            'level.levelProgresses.level',
            'level.levelProgresses.student',
          ],
        });
        if (!currentStory) {
          throw new NotFoundException(
            `Cerita (Story) dengan ID ${storyId} tidak ditemukan`,
          );
        }

        if (!currentStory.isCurrentStudentValidForStory(studentId)) {
          throw new ForbiddenException(
            `Siswa dengan ID ${studentId} tidak memiliki akses ke cerita (story) ini`,
          );
        }

        const newTestSession: TestSession = testSessionRepo.create({
          id: 'TESTSESSION-' + this.tokenGeneratorService.randomUUIDV7(),
          titleAtTaken: currentStory.title,
          imageAtTaken: currentStory.image,
          descriptionAtTaken: currentStory.description,
          passageAtTaken: currentStory.passage,
          student: { id: studentId } as Student,
          story: { id: storyId } as Story,
        });

        const savedTestSession: TestSession =
          await testSessionRepo.save(newTestSession);

        const { level, ...storyWithoutLevel } = currentStory;
        const testSessionDTO: TestSessionResponseDTO = {
          id: savedTestSession.id,
          student: currentStudent,
          story: storyWithoutLevel as Story,
          levelFullName: level.fullName,
          titleAtTaken: savedTestSession.titleAtTaken,
          imageAtTaken: savedTestSession.imageAtTaken,
          imageAtTakenUrl: savedTestSession.imageAtTakenUrl,
          descriptionAtTaken: savedTestSession.descriptionAtTaken,
          passageAtTaken: savedTestSession.passageAtTaken,
          passagesAtTaken: Story.passageToSentences(
            savedTestSession.passageAtTaken,
          ),
          startedAt: savedTestSession.startedAt,
          finishedAt: savedTestSession.finishedAt,
          remainingTimeInSeconds: savedTestSession.remainingTimeInSeconds,
          medal: savedTestSession.medal,
          score: savedTestSession.score,
          isCompleted: !!savedTestSession.finishedAt,
          createdAt: savedTestSession.createdAt,
          updatedAt: savedTestSession.updatedAt,
        };

        return testSessionDTO;
      },
    );
  }

  public async getTestSessionStatus(
    testSessionId: string,
    studentId: string,
  ): Promise<TestSessionResponseDTO> {
    const testSession: TestSession = await this.findAndAuthorizeTestSession(
      testSessionId,
      studentId,
    );
    if (testSession.finishedAt) {
      throw new ForbiddenException(
        `Waktu sesi tes dengan ID ${testSessionId} telah habis`,
      );
    }

    if (testSession.remainingTimeInSeconds <= 0) {
      testSession.finishedAt = new Date();
      await this.testSessionRepository.save(testSession);
      throw new ForbiddenException(
        `Waktu sesi tes dengan ID ${testSessionId} telah habis`,
      );
    }

    const { level, ...storyWithoutLevel } = testSession.story!;
    const testSessionDTO: TestSessionResponseDTO = {
      id: testSession.id,
      student: testSession.student,
      story: storyWithoutLevel as Story,
      levelFullName: level.fullName,
      titleAtTaken: testSession.titleAtTaken,
      imageAtTaken: testSession.imageAtTaken,
      imageAtTakenUrl: testSession.imageAtTakenUrl,
      descriptionAtTaken: testSession.descriptionAtTaken,
      passageAtTaken: testSession.passageAtTaken,
      passagesAtTaken: Story.passageToSentences(testSession.passageAtTaken),
      startedAt: testSession.startedAt,
      finishedAt: testSession.finishedAt,
      remainingTimeInSeconds: testSession.remainingTimeInSeconds,
      medal: testSession.medal,
      score: testSession.score,
      isCompleted: !!testSession.finishedAt,
      createdAt: testSession.createdAt,
      updatedAt: testSession.updatedAt,
    };

    return testSessionDTO;
  }

  public async getTestSessionByIdForStudent(
    testSessionId: string,
    studentId: string,
  ): Promise<TestSessionResponseDTO> {
    const testSession: TestSession = await this.findAndAuthorizeTestSession(
      testSessionId,
      studentId,
    );

    if (testSession.remainingTimeInSeconds <= 0) {
      if (!testSession.finishedAt) {
        testSession.finishedAt = new Date();
        await this.testSessionRepository.save(testSession);
      }
    }

    const { level, ...storyWithoutLevel } = testSession.story!;
    const testSessionDTO: TestSessionResponseDTO = {
      id: testSession.id,
      student: testSession.student,
      story: storyWithoutLevel as Story,
      levelFullName: level.fullName,
      titleAtTaken: testSession.titleAtTaken,
      imageAtTaken: testSession.imageAtTaken,
      imageAtTakenUrl: testSession.imageAtTakenUrl,
      descriptionAtTaken: testSession.descriptionAtTaken,
      passageAtTaken: testSession.passageAtTaken,
      passagesAtTaken: Story.passageToSentences(testSession.passageAtTaken),
      startedAt: testSession.startedAt,
      finishedAt: testSession.finishedAt,
      remainingTimeInSeconds: testSession.remainingTimeInSeconds,
      medal: testSession.medal,
      score: testSession.score,
      isCompleted: !!testSession.finishedAt,
      createdAt: testSession.createdAt,
      updatedAt: testSession.updatedAt,
    };

    return testSessionDTO;
  }

  public async startSTTQuestionSession(
    testSessionId: string,
    studentId: string,
  ): Promise<STTQuestionResponseDTO[]> {
    return this.withTransaction<STTQuestionResponseDTO[]>(
      async (manager: EntityManager) => {
        const testSessionRepo: Repository<TestSession> =
          manager.getRepository(TestSession);
        const sttWordResultRepo: Repository<STTWordResult> =
          manager.getRepository(STTWordResult);

        const testSession: TestSession = await this.findAndAuthorizeTestSession(
          testSessionId,
          studentId,
          {
            repository: testSessionRepo,
          },
        );

        if (testSession.finishedAt) {
          throw new ForbiddenException(
            `Waktu sesi tes dengan ID ${testSessionId} telah habis`,
          );
        }
        if (testSession.remainingTimeInSeconds <= 0) {
          testSession.finishedAt = new Date();
          await testSessionRepo.save(testSession);
          throw new ForbiddenException(
            `Waktu sesi tes dengan ID ${testSessionId} telah habis`,
          );
        }

        const sttWordResults: STTWordResult[] = await sttWordResultRepo.find({
          where: { testSession: { id: testSessionId } },
        });

        if (sttWordResults.length > 0) {
          throw new ForbiddenException(
            `Sesi pertanyaan STT untuk sesi tes dengan ID ${testSessionId} sudah pernah dimulai`,
          );
        }

        // Initialize STT Word Results for the Test Session
        const questionsResponseDTO: STTQuestionResponseDTO[] = [];
        let questions: string[];

        if (
          testSession.story?.level.no === 0 ||
          testSession.story?.level.no === 9999
        ) {
          // Pre-Test or Post-Test same questions
          questions =
            await this.openRouterService.generateQuestionsForPreTest();
        } else {
          // Regular Level
          questions =
            await this.openRouterService.generateQuestionsFromStoryPassage(
              testSession.passageAtTaken,
            );
        }

        for (const question of questions) {
          const sttWordResult: STTWordResult = sttWordResultRepo.create({
            id: 'STTWORDRESULT-' + this.tokenGeneratorService.randomUUIDV7(),
            testSession: { id: testSessionId } as TestSession,
            expectedWord: question,
          });
          await sttWordResultRepo.save(sttWordResult);
          questionsResponseDTO.push({
            id: sttWordResult.id,
            instruction: sttWordResult.instruction,
            expectedWord: sttWordResult.expectedWord,
            createdAt: sttWordResult.createdAt,
            updatedAt: sttWordResult.updatedAt,
          });
        }

        return questionsResponseDTO;
      },
    );
  }

  public async answerSTTQuestionSession(
    testSessionId: string,
    sttQuestionId: string,
    studentId: string,
    answerSTTQuestionDTO: AnswerSTTQuestionDTO,
  ): Promise<STTAnsweredQuestionDTO> {
    const testSession: TestSession = await this.findAndAuthorizeTestSession(
      testSessionId,
      studentId,
    );
    if (testSession.finishedAt) {
      throw new ForbiddenException(
        `Waktu sesi tes dengan ID ${testSessionId} telah habis`,
      );
    }
    if (testSession.remainingTimeInSeconds <= 0) {
      testSession.finishedAt = new Date();
      await this.testSessionRepository.save(testSession);
      throw new ForbiddenException(
        `Waktu sesi tes dengan ID ${testSessionId} telah habis`,
      );
    }

    const sttWordResult: STTWordResult | null =
      await this.sttWordResultRepository.findOne({
        where: {
          id: sttQuestionId,
          testSession: { id: testSessionId },
        },
      });
    if (!sttWordResult) {
      throw new NotFoundException(
        `Pertanyaan STT dengan ID ${sttQuestionId} untuk sesi tes dengan ID ${testSessionId} tidak ditemukan`,
      );
    }
    if (!sttWordResult.canBeAnswered()) {
      throw new ForbiddenException(
        `Pertanyaan STT dengan ID ${sttQuestionId} untuk sesi tes dengan ID ${testSessionId} sudah pernah dijawab`,
      );
    }

    sttWordResult.spokenWord = answerSTTQuestionDTO.spokenWord;
    sttWordResult.accuracy = answerSTTQuestionDTO.accuracy;
    await this.sttWordResultRepository.save(sttWordResult);

    const answeredQuestionDTO: STTAnsweredQuestionDTO = {
      id: sttWordResult.id,
      instruction: sttWordResult.instruction,
      expectedWord: sttWordResult.expectedWord,
      spokenWord: sttWordResult.spokenWord,
      accuracy: sttWordResult.accuracy,
      createdAt: sttWordResult.createdAt,
      updatedAt: sttWordResult.updatedAt,
    };

    return answeredQuestionDTO;
  }

  public async finishTestSession(
    testSessionId: string,
    studentId: string,
  ): Promise<TestSessionResponseDTO> {
    const testSession: TestSession = await this.findAndAuthorizeTestSession(
      testSessionId,
      studentId,
    );
    if (testSession.finishedAt) {
      throw new ForbiddenException(
        `Sesi tes dengan ID ${testSessionId} sudah selesai`,
      );
    }
    const sttWordResults: STTWordResult[] =
      await this.sttWordResultRepository.find({
        where: { testSession: { id: testSessionId } },
        relations: ['testSession'],
      });
    const distractedEyeEvents: DistractedEyeEvent[] =
      await this.distractedEyeEventRepository.find({
        where: { testSession: { id: testSessionId } },
        relations: ['testSession'],
      });

    const isPreTest: boolean = testSession.story?.level.no === 0;
    const isPostTest: boolean = testSession.story?.level.no === 9999;
    testSession.score = testSession.calculateScore(
      sttWordResults,
      distractedEyeEvents,
      testSession.passageAtTaken.trim().split(/\s+/).length,
      isPreTest || isPostTest,
    );
    testSession.medal = testSession.determineMedal();
    testSession.finishedAt = new Date();

    // -- HANDLE PRE-TEST COMPLETION AND LEVEL PROGRESS UPDATES --
    if (isPreTest) {
      await this.handlePreTestCompletion(testSession, studentId);
    }
    // -- END HANDLE PRE-TEST COMPLETION AND LEVEL PROGRESS UPDATES --

    // -- POST-TEST HANDLING NO PROGRESSION --
    if (isPostTest) {
      await this.testSessionRepository.save(testSession);

      const { level, ...storyWithoutLevel } = testSession.story!;
      const testSessionDTO: TestSessionResponseDTO = {
        id: testSession.id,
        student: testSession.student,
        story: storyWithoutLevel as Story,
        levelFullName: level.fullName,
        titleAtTaken: testSession.titleAtTaken,
        imageAtTaken: testSession.imageAtTaken,
        imageAtTakenUrl: testSession.imageAtTakenUrl,
        descriptionAtTaken: testSession.descriptionAtTaken,
        passageAtTaken: testSession.passageAtTaken,
        passagesAtTaken: Story.passageToSentences(testSession.passageAtTaken),
        startedAt: testSession.startedAt,
        finishedAt: testSession.finishedAt,
        remainingTimeInSeconds: testSession.remainingTimeInSeconds,
        medal: testSession.medal,
        score: testSession.score,
        isCompleted: !!testSession.finishedAt,
        createdAt: testSession.createdAt,
        updatedAt: testSession.updatedAt,
      };

      return testSessionDTO;
    }
    // -- END POST-TEST HANDLING --

    // Update Level Progress medal count based on the medal achieved in this Test Session
    const levelProgress: LevelProgress | undefined =
      testSession.story?.level.levelProgresses.find(
        (lp) =>
          lp.level_id === testSession.story?.level.id &&
          lp.student_id === studentId,
      );
    if (levelProgress) {
      // Find the best medal ever achieved for this story (excluding current session)
      const allPreviousSessions: TestSession[] =
        await this.testSessionRepository.find({
          where: {
            student: { id: studentId },
            story: { id: testSession.story?.id },
            finishedAt: Not(IsNull()),
            id: Not(testSessionId),
          },
        });

      // Find the highest medal value from all previous sessions
      let bestPreviousMedal: StoryMedal | null = null;
      let highestMedalValue = 0;
      for (const session of allPreviousSessions) {
        const medalValue = this.getMedalValue(session.medal ?? null);
        if (medalValue > highestMedalValue) {
          highestMedalValue = medalValue;
          bestPreviousMedal = session.medal ?? null;
        }
      }

      // Only update medal count if new medal is higher than the best previous medal
      if (bestPreviousMedal) {
        const previousMedalValue: number =
          this.getMedalValue(bestPreviousMedal);
        const newMedalValue: number = this.getMedalValue(testSession.medal);

        // If new medal is higher, remove old best medal and add new one
        if (newMedalValue > previousMedalValue) {
          // Remove the best previous medal count
          if (bestPreviousMedal === StoryMedal.GOLD) {
            levelProgress.goldCount = Math.max(0, levelProgress.goldCount - 1);
          } else if (bestPreviousMedal === StoryMedal.SILVER) {
            levelProgress.silverCount = Math.max(
              0,
              levelProgress.silverCount - 1,
            );
          } else if (bestPreviousMedal === StoryMedal.BRONZE) {
            levelProgress.bronzeCount = Math.max(
              0,
              levelProgress.bronzeCount - 1,
            );
          }

          // Add new medal count
          if (testSession.medal === StoryMedal.GOLD) {
            levelProgress.goldCount += 1;
          } else if (testSession.medal === StoryMedal.SILVER) {
            levelProgress.silverCount += 1;
          } else if (testSession.medal === StoryMedal.BRONZE) {
            levelProgress.bronzeCount += 1;
          }
        }
        // If new medal is lower or equal, don't update anything
      } else {
        // No previous session, add the new medal
        if (testSession.medal === StoryMedal.GOLD) {
          levelProgress.goldCount += 1;
        } else if (testSession.medal === StoryMedal.SILVER) {
          levelProgress.silverCount += 1;
        } else if (testSession.medal === StoryMedal.BRONZE) {
          levelProgress.bronzeCount += 1;
        }
      }

      await this.withTransaction<void>(async (manager: EntityManager) => {
        const levelProgressRepo: Repository<LevelProgress> =
          manager.getRepository(LevelProgress);
        const testSessionRepo: Repository<TestSession> =
          manager.getRepository(TestSession);
        const levelRepo: Repository<Level> = manager.getRepository(Level);

        await levelProgressRepo.save(levelProgress);
        await testSessionRepo.save(testSession);

        // Reload level progress with relations to get accurate requiredPoints calculation
        const reloadedLevelProgress: LevelProgress | null =
          await levelProgressRepo.findOne({
            where: {
              student_id: studentId,
              level_id: levelProgress.level_id,
            },
            relations: ['level', 'level.stories'],
          });
        // Unlock next level
        if (
          reloadedLevelProgress &&
          reloadedLevelProgress.requiredPoints <= 0 &&
          !reloadedLevelProgress.isCompleted
        ) {
          reloadedLevelProgress.isCompleted = true;
          await levelProgressRepo.save(reloadedLevelProgress);

          // Find and unlock the next level
          const currentLevelNo = testSession.story?.level.no;
          if (currentLevelNo) {
            const nextLevel: Level | null = await levelRepo.findOne({
              where: { no: currentLevelNo + 1 },
            });

            if (nextLevel) {
              // Check if next level progress exists
              let nextLevelProgress: LevelProgress | null =
                await levelProgressRepo.findOne({
                  where: {
                    student_id: studentId,
                    level_id: nextLevel.id,
                  },
                });

              if (!nextLevelProgress) {
                // Create new progress for next level
                nextLevelProgress = levelProgressRepo.create({
                  student_id: studentId,
                  level_id: nextLevel.id,
                  isUnlocked: true,
                });
              } else {
                // Update existing progress
                nextLevelProgress.isUnlocked = true;
              }

              await levelProgressRepo.save(nextLevelProgress);
            }
          }
        }
      });
    }

    const { level, ...storyWithoutLevel } = testSession.story!;
    const testSessionDTO: TestSessionResponseDTO = {
      id: testSession.id,
      student: testSession.student,
      story: storyWithoutLevel as Story,
      levelFullName: level.fullName,
      titleAtTaken: testSession.titleAtTaken,
      imageAtTaken: testSession.imageAtTaken,
      imageAtTakenUrl: testSession.imageAtTakenUrl,
      descriptionAtTaken: testSession.descriptionAtTaken,
      passageAtTaken: testSession.passageAtTaken,
      passagesAtTaken: Story.passageToSentences(testSession.passageAtTaken),
      startedAt: testSession.startedAt,
      finishedAt: testSession.finishedAt,
      remainingTimeInSeconds: testSession.remainingTimeInSeconds,
      medal: testSession.medal,
      score: testSession.score,
      isCompleted: !!testSession.finishedAt,
      createdAt: testSession.createdAt,
      updatedAt: testSession.updatedAt,
    };

    return testSessionDTO;
  }

  private getMedalValue(medal: StoryMedal | null): number {
    if (!medal) return 0;
    switch (medal) {
      case StoryMedal.GOLD:
        return 3;
      case StoryMedal.SILVER:
        return 2;
      case StoryMedal.BRONZE:
        return 1;
      default:
        return 0;
    }
  }

  private async findAndAuthorizeTestSession(
    testSessionId: string,
    studentId: string,
    {
      relations = [
        'student',
        'story',
        'story.level',
        'story.level.levelProgresses',
        'story.level.levelProgresses.level',
      ],
      repository = this.testSessionRepository,
    }: {
      relations?: string[];
      repository?: Repository<TestSession>;
    } = {},
  ): Promise<TestSession> {
    const testSession = await repository.findOne({
      where: { id: testSessionId, student: { id: studentId } },
      relations: relations,
    });
    if (!testSession) {
      throw new NotFoundException(
        `Sesi tes dengan ID ${testSessionId} tidak ditemukan`,
      );
    }

    return testSession;
  }

  /**
   * Handle Pre-Test (Level 0) completion and automatically unlock/skip levels based on score
   */
  private async handlePreTestCompletion(
    testSession: TestSession,
    studentId: string,
  ): Promise<void> {
    const score: number = testSession.score;
    let targetLevel: number = 1; // Default: start from Level 1

    // Determine target level based on score
    if (score >= 80) {
      targetLevel = 5;
    } else if (score >= 60) {
      targetLevel = 4;
    } else if (score >= 40) {
      targetLevel = 3;
    } else if (score >= 20) {
      targetLevel = 2;
    } else {
      targetLevel = 1;
    }

    // If score is low (< 70), no need to skip levels, student starts from Level 1
    if (targetLevel === 1) {
      this.logger.info(
        `Student ${studentId} scored ${score} on pre-test. Starting from Level 1.`,
      );
      return;
    }

    // Skip levels and unlock target level
    await this.withTransaction<void>(async (manager: EntityManager) => {
      const levelRepo: Repository<Level> = manager.getRepository(Level);
      const levelProgressRepo: Repository<LevelProgress> =
        manager.getRepository(LevelProgress);

      // Get all levels that need to be processed (1 to targetLevel)
      const levels: Level[] = await levelRepo.find({
        where: { isBonusLevel: false },
        order: { no: 'ASC' },
      });

      for (const level of levels) {
        if (level.no === 0 || level.no === 9999) continue;

        if (level.no <= targetLevel) {
          // Find or create level progress
          let levelProgress: LevelProgress | null =
            await levelProgressRepo.findOne({
              where: {
                student_id: studentId,
                level_id: level.id,
              },
            });

          if (!levelProgress) {
            levelProgress = levelProgressRepo.create({
              student_id: studentId,
              level_id: level.id,
            });
          }

          // Unlock the target level
          levelProgress.isUnlocked = true;

          // Mark levels before target as completed and skipped
          if (level.no < targetLevel) {
            levelProgress.isCompleted = true;
            levelProgress.isSkipped = true;
          }

          await levelProgressRepo.save(levelProgress);
        }
      }

      this.logger.info(
        `Student ${studentId} scored ${score} on pre-test. Skipped to Level ${targetLevel}.`,
      );
    });
  }

  public async createDistractionEvent(
    testSessionId: string,
    studentId: string,
    createDistractionEventDTO: CreateDistractionEventDTO,
  ): Promise<DistractionEventResponseDTO> {
    const testSession: TestSession = await this.findAndAuthorizeTestSession(
      testSessionId,
      studentId,
    );
    if (testSession.finishedAt) {
      throw new ForbiddenException(
        `Sesi tes dengan ID ${testSessionId} sudah selesai`,
      );
    }

    const newDistractionEvent: DistractedEyeEvent =
      this.distractedEyeEventRepository.create({
        id: 'DISTRACTEDEYE-' + this.tokenGeneratorService.randomUUIDV7(),
        testSession: { id: testSessionId } as TestSession,
        distractionType: createDistractionEventDTO.distractionType,
        triggerDurationMs: createDistractionEventDTO.triggerDurationMs,
        occurredAtWord: createDistractionEventDTO.occurAtWord,
      });

    const savedEvent: DistractedEyeEvent =
      await this.distractedEyeEventRepository.save(newDistractionEvent);

    return {
      id: savedEvent.id,
      distractionType: savedEvent.distractionType,
      triggerDurationMs: savedEvent.triggerDurationMs,
      occurredAtWord: savedEvent.occurredAtWord,
      createdAt: savedEvent.createdAt,
      updatedAt: savedEvent.updatedAt,
    } as DistractionEventResponseDTO;
  }

  public async createDistractionSummary(
    testSessionId: string,
    studentId: string,
    createDistractionSummaryDTO: CreateDistractionSummaryDTO,
  ): Promise<DistractionSummaryResponseDTO> {
    const testSession: TestSession = await this.findAndAuthorizeTestSession(
      testSessionId,
      studentId,
    );
    if (testSession.finishedAt) {
      throw new ForbiddenException(
        `Sesi tes dengan ID ${testSessionId} sudah selesai`,
      );
    }

    // Check if summary already exists
    const existingSummary: DistractedEyeEventsSummary | null =
      await this.distractedEyeEventsSummaryRepository.findOne({
        where: { testSession: { id: testSessionId } },
      });

    if (existingSummary) {
      throw new ForbiddenException(
        `Ringkasan distraksi untuk sesi tes dengan ID ${testSessionId} sudah pernah dibuat`,
      );
    }

    const newSummary: DistractedEyeEventsSummary =
      this.distractedEyeEventsSummaryRepository.create({
        id: 'DISTRACTEDSUMMARY-' + this.tokenGeneratorService.randomUUIDV7(),
        testSession: { id: testSessionId } as TestSession,
        totalSessionDurationSec:
          createDistractionSummaryDTO.totalSessionDurationSec,
        timeBreakdownFocus: createDistractionSummaryDTO.timeBreakdownFocus,
        timeBreakdownTurning: createDistractionSummaryDTO.timeBreakdownTurning,
        timeBreakdownGlance: createDistractionSummaryDTO.timeBreakdownGlance,
        timeBreakdownNotDetected:
          createDistractionSummaryDTO.timeBreakdownNotDetected,
        turningTriggersCount: createDistractionSummaryDTO.turningTriggersCount,
        glanceTriggersCount: createDistractionSummaryDTO.glanceTriggersCount,
        avgPoseVariance: createDistractionSummaryDTO.avgPoseVariance,
        longFixationCount: createDistractionSummaryDTO.longFixationCount,
      });

    const savedSummary: DistractedEyeEventsSummary =
      await this.distractedEyeEventsSummaryRepository.save(newSummary);

    return {
      id: savedSummary.id,
      totalSessionDurationSec: savedSummary.totalSessionDurationSec,
      timeBreakdownFocus: savedSummary.timeBreakdownFocus,
      timeBreakdownTurning: savedSummary.timeBreakdownTurning,
      timeBreakdownGlance: savedSummary.timeBreakdownGlance,
      timeBreakdownNotDetected: savedSummary.timeBreakdownNotDetected,
      turningTriggersCount: savedSummary.turningTriggersCount,
      glanceTriggersCount: savedSummary.glanceTriggersCount,
      avgPoseVariance: savedSummary.avgPoseVariance,
      longFixationCount: savedSummary.longFixationCount,
      createdAt: savedSummary.createdAt,
      updatedAt: savedSummary.updatedAt,
    } as DistractionSummaryResponseDTO;
  }
}
