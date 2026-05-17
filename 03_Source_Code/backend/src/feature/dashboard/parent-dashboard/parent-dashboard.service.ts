import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { In, Repository } from 'typeorm';
import { LevelProgress } from '../../levels/entities/level-progress.entity';
import { DistractionEventResponseDTO } from '../../test-session/dtos/distraction-event-response.dto';
import { DistractedEyeEvent } from '../../test-session/entities/distracted-eye-event.entity';
import { STTWordResult } from '../../test-session/entities/stt-word-result.entity';
import { TestSession } from '../../test-session/entities/test-session.entity';
import { Parent } from '../../users/entities/parent.entity';
import { Student } from '../../users/entities/student.entity';
import {
  LevelProgressDTO,
  ParentDashboardOverviewDTO,
  ParentDashboardStudentDTO,
  ParentDashboardTestSessionDTO,
  STTWordResultDTO,
} from './dtos/parent-dashboard.dto';

@Injectable()
export class ParentDashboardService {
  constructor(
    private readonly logger: PinoLogger,

    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(TestSession)
    private readonly testSessionRepository: Repository<TestSession>,
  ) {
    this.logger.setContext(ParentDashboardService.name);
  }

  public async getParentDashboardOverview(
    parentId: string,
  ): Promise<ParentDashboardOverviewDTO> {
    const students: Student[] = await this.studentRepository.find({
      where: { parent: { id: parentId } },
    });

    const studentIds: string[] = students.map((s: Student): string => s.id);

    const allTestSessions: TestSession[] = studentIds.length
      ? await this.testSessionRepository.find({
          where: { student: { id: In(studentIds) } },
          relations: [
            'student',
            'sttWordResults',
            'story',
            'story.level',
            'distractedEyeEvents',
            'distractedEyeEventsSummary',
          ],
          order: { startedAt: 'DESC' },
        })
      : [];

    const completedSessions: TestSession[] = allTestSessions.filter(
      (ts: TestSession): boolean => !!ts.finishedAt,
    );
    const inProgressSessions: TestSession[] = allTestSessions.filter(
      (ts: TestSession): boolean => !ts.finishedAt,
    );

    const totalScore: number = completedSessions.reduce(
      (sum: number, ts: TestSession): number => sum + (ts.score || 0),
      0,
    );
    const averageScore: number =
      completedSessions.length > 0 ? totalScore / completedSessions.length : 0;

    const testSessions: ParentDashboardTestSessionDTO[] = allTestSessions.map(
      (ts: TestSession): ParentDashboardTestSessionDTO => ({
        id: ts.id,
        student: {
          id: ts.student.id,
          username: ts.student.username,
          fullName: ts.student.fullName,
        },
        levelFullName: ts.story?.level.fullName ?? '-',
        titleAtTaken: ts.titleAtTaken,
        startedAt: ts.startedAt,
        finishedAt: ts.finishedAt,
        medal: ts.medal,
        score: ts.score,
        isCompleted: !!ts.finishedAt,
        sttWordResults: ts.sttWordResults.map(
          (result: STTWordResult): STTWordResultDTO => ({
            id: result.id,
            instruction: result.instruction,
            expectedWord: result.expectedWord,
            spokenWord: result.spokenWord,
            accuracy: result.accuracy,
            createdAt: result.createdAt,
          }),
        ),
        distractedEyeEvents: (ts.distractedEyeEvents || []).map(
          (event: DistractedEyeEvent): DistractionEventResponseDTO => ({
            id: event.id,
            distractionType: event.distractionType,
            triggerDurationMs: event.triggerDurationMs,
            occurredAtWord: event.occurredAtWord,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
          }),
        ),
        distractedEyeEventsSummary: ts.distractedEyeEventsSummary
          ? {
              id: ts.distractedEyeEventsSummary.id,
              totalSessionDurationSec:
                ts.distractedEyeEventsSummary.totalSessionDurationSec,
              timeBreakdownFocus:
                ts.distractedEyeEventsSummary.timeBreakdownFocus,
              timeBreakdownTurning:
                ts.distractedEyeEventsSummary.timeBreakdownTurning,
              timeBreakdownGlance:
                ts.distractedEyeEventsSummary.timeBreakdownGlance,
              timeBreakdownNotDetected:
                ts.distractedEyeEventsSummary.timeBreakdownNotDetected,
              turningTriggersCount:
                ts.distractedEyeEventsSummary.turningTriggersCount,
              glanceTriggersCount:
                ts.distractedEyeEventsSummary.glanceTriggersCount,
              avgPoseVariance: ts.distractedEyeEventsSummary.avgPoseVariance,
              longFixationCount:
                ts.distractedEyeEventsSummary.longFixationCount,
              createdAt: ts.distractedEyeEventsSummary.createdAt,
              updatedAt: ts.distractedEyeEventsSummary.updatedAt,
            }
          : undefined,
      }),
    );

    return {
      totalStudents: students.length,
      totalTestSessions: allTestSessions.length,
      completedTestSessions: completedSessions.length,
      inProgressTestSessions: inProgressSessions.length,
      averageScore: Math.round(averageScore * 100) / 100,
      testSessions: testSessions,
    };
  }

  public async getParentChildren(
    parentId: string,
  ): Promise<ParentDashboardStudentDTO[]> {
    const students: Student[] = await this.studentRepository.find({
      where: { parent: { id: parentId } },
      relations: [
        'teacher',
        'testSessions',
        'levelProgresses',
        'levelProgresses.level',
      ],
      order: { createdAt: 'DESC' },
    });

    return students.map((student: Student): ParentDashboardStudentDTO => {
      const completedSessions: TestSession[] = student.testSessions.filter(
        (ts: TestSession): boolean => (ts.finishedAt ? true : false),
      );
      const inProgressSessions: TestSession[] = student.testSessions.filter(
        (ts: TestSession): boolean => (ts.finishedAt ? false : true),
      );

      const totalScore: number = completedSessions.reduce(
        (sum: number, ts: TestSession): number => sum + (ts.score || 0),
        0,
      );
      const averageScore: number =
        completedSessions.length > 0
          ? totalScore / completedSessions.length
          : 0;

      const lastSession: TestSession = student.testSessions.sort(
        (a: TestSession, b: TestSession): number =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )[0];

      const levelProgressDTOs: LevelProgressDTO[] = student.levelProgresses
        .sort(
          (a: LevelProgress, b: LevelProgress): number =>
            a.level.no - b.level.no,
        )
        .map(
          (lp: LevelProgress): LevelProgressDTO => ({
            levelId: lp.level.id,
            levelNo: lp.level.no,
            levelName: lp.level.name,
            levelFullName: lp.level.fullName,
            isUnlocked: lp.isUnlocked,
            isCompleted: lp.isCompleted,
            isSkipped: lp.isSkipped,
            currentPoints: lp.currentPoints,
            maxPoints: lp.level.maxPoints,
            progress: lp.progress,
            requiredPoints: lp.requiredPoints,
            goldCount: lp.goldCount,
            silverCount: lp.silverCount,
            bronzeCount: lp.bronzeCount,
            createdAt: lp.createdAt,
            updatedAt: lp.updatedAt,
          }),
        );

      return {
        id: student.id,
        username: student.username,
        fullName: student.fullName,
        teacher: {
          id: student.teacher.id,
          username: student.teacher.username,
          fullName: student.teacher.fullName,
        },
        totalTestSessions: student.testSessions.length,
        completedTestSessions: completedSessions.length,
        inProgressTestSessions: inProgressSessions.length,
        averageScore: Math.round(averageScore * 100) / 100,
        lastTestSessionAt: lastSession?.startedAt ?? null,
        levelProgresses: levelProgressDTOs,
        createdAt: student.createdAt,
      };
    });
  }

  public async getChildTestSessions(
    parentId: string,
    studentId: string,
  ): Promise<ParentDashboardTestSessionDTO[]> {
    const student: Student | null = await this.studentRepository.findOne({
      where: { id: studentId, parent: { id: parentId } },
    });
    if (!student) {
      throw new NotFoundException('Anak tidak ditemukan atau bukan anak Anda');
    }

    const testSessions: TestSession[] = await this.testSessionRepository.find({
      where: { student: { id: studentId } },
      relations: [
        'student',
        'sttWordResults',
        'story',
        'story.level',
        'distractedEyeEvents',
        'distractedEyeEventsSummary',
      ],
      order: { startedAt: 'DESC' },
    });

    return testSessions.map(
      (ts: TestSession): ParentDashboardTestSessionDTO => ({
        id: ts.id,
        student: {
          id: ts.student.id,
          username: ts.student.username,
          fullName: ts.student.fullName,
        },
        levelFullName: ts.story?.level.fullName ?? '-',
        titleAtTaken: ts.titleAtTaken,
        startedAt: ts.startedAt,
        finishedAt: ts.finishedAt,
        medal: ts.medal,
        score: ts.score,
        isCompleted: !!ts.finishedAt,
        sttWordResults: ts.sttWordResults.map(
          (result: STTWordResult): STTWordResultDTO => ({
            id: result.id,
            instruction: result.instruction,
            expectedWord: result.expectedWord,
            spokenWord: result.spokenWord,
            accuracy: result.accuracy,
            createdAt: result.createdAt,
          }),
        ),
        distractedEyeEvents: (ts.distractedEyeEvents || []).map(
          (event: DistractedEyeEvent): DistractionEventResponseDTO => ({
            id: event.id,
            distractionType: event.distractionType,
            triggerDurationMs: event.triggerDurationMs,
            occurredAtWord: event.occurredAtWord,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
          }),
        ),
        distractedEyeEventsSummary: ts.distractedEyeEventsSummary
          ? {
              id: ts.distractedEyeEventsSummary.id,
              totalSessionDurationSec:
                ts.distractedEyeEventsSummary.totalSessionDurationSec,
              timeBreakdownFocus:
                ts.distractedEyeEventsSummary.timeBreakdownFocus,
              timeBreakdownTurning:
                ts.distractedEyeEventsSummary.timeBreakdownTurning,
              timeBreakdownGlance:
                ts.distractedEyeEventsSummary.timeBreakdownGlance,
              timeBreakdownNotDetected:
                ts.distractedEyeEventsSummary.timeBreakdownNotDetected,
              turningTriggersCount:
                ts.distractedEyeEventsSummary.turningTriggersCount,
              glanceTriggersCount:
                ts.distractedEyeEventsSummary.glanceTriggersCount,
              avgPoseVariance: ts.distractedEyeEventsSummary.avgPoseVariance,
              longFixationCount:
                ts.distractedEyeEventsSummary.longFixationCount,
              createdAt: ts.distractedEyeEventsSummary.createdAt,
              updatedAt: ts.distractedEyeEventsSummary.updatedAt,
            }
          : undefined,
      }),
    );
  }

  public async getChildTestSession(
    parentId: string,
    studentId: string,
    testSessionId: string,
  ): Promise<ParentDashboardTestSessionDTO> {
    const student: Student | null = await this.studentRepository.findOne({
      where: { id: studentId, parent: { id: parentId } },
    });
    if (!student) {
      throw new NotFoundException('Anak tidak ditemukan atau bukan anak Anda');
    }

    const testSession: TestSession | null =
      await this.testSessionRepository.findOne({
        where: { id: testSessionId, student: { id: studentId } },
        relations: [
          'student',
          'sttWordResults',
          'story',
          'story.level',
          'distractedEyeEvents',
          'distractedEyeEventsSummary',
        ],
      });
    if (!testSession) {
      throw new NotFoundException(
        `Sesi tes ${testSessionId} tidak ditemukan untuk anak ini`,
      );
    }

    const testSessionDTO: ParentDashboardTestSessionDTO = {
      id: testSession.id,
      student: {
        id: testSession.student.id,
        username: testSession.student.username,
        fullName: testSession.student.fullName,
      },
      levelFullName: testSession.story?.level.fullName ?? '-',
      titleAtTaken: testSession.titleAtTaken,
      startedAt: testSession.startedAt,
      finishedAt: testSession.finishedAt,
      medal: testSession.medal,
      score: testSession.score,
      isCompleted: !!testSession.finishedAt,
      sttWordResults: testSession.sttWordResults.map(
        (result: STTWordResult): STTWordResultDTO => ({
          id: result.id,
          instruction: result.instruction,
          expectedWord: result.expectedWord,
          spokenWord: result.spokenWord,
          accuracy: result.accuracy,
          createdAt: result.createdAt,
        }),
      ),
      distractedEyeEvents: (testSession.distractedEyeEvents || []).map(
        (event: DistractedEyeEvent): DistractionEventResponseDTO => ({
          id: event.id,
          distractionType: event.distractionType,
          triggerDurationMs: event.triggerDurationMs,
          occurredAtWord: event.occurredAtWord,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }),
      ),
      distractedEyeEventsSummary: testSession.distractedEyeEventsSummary
        ? {
            id: testSession.distractedEyeEventsSummary.id,
            totalSessionDurationSec:
              testSession.distractedEyeEventsSummary.totalSessionDurationSec,
            timeBreakdownFocus:
              testSession.distractedEyeEventsSummary.timeBreakdownFocus,
            timeBreakdownTurning:
              testSession.distractedEyeEventsSummary.timeBreakdownTurning,
            timeBreakdownGlance:
              testSession.distractedEyeEventsSummary.timeBreakdownGlance,
            timeBreakdownNotDetected:
              testSession.distractedEyeEventsSummary.timeBreakdownNotDetected,
            turningTriggersCount:
              testSession.distractedEyeEventsSummary.turningTriggersCount,
            glanceTriggersCount:
              testSession.distractedEyeEventsSummary.glanceTriggersCount,
            avgPoseVariance:
              testSession.distractedEyeEventsSummary.avgPoseVariance,
            longFixationCount:
              testSession.distractedEyeEventsSummary.longFixationCount,
            createdAt: testSession.distractedEyeEventsSummary.createdAt,
            updatedAt: testSession.distractedEyeEventsSummary.updatedAt,
          }
        : undefined,
    };

    return testSessionDTO;
  }
}
