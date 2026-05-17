/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { MailService } from 'src/common/mail/mail.service';
import { TokenGeneratorService } from 'src/common/token-generator/token-generator.service';
import { LevelSeeder } from 'src/database/seeders/level.seeder';
import { OpenRouterService } from 'src/feature/ai/open-router.service';
import { Level } from 'src/feature/levels/entities/level.entity';
import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryMedal } from 'src/feature/levels/enum/story-medal.enum';
import { STTWordResult } from 'src/feature/test-session/entities/stt-word-result.entity';
import { TestSession } from 'src/feature/test-session/entities/test-session.entity';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import createTestingApp from '../../../utils/create-testing-app.utils';
import { clearDatabase } from '../../../utils/testing-database.utils';

describe('Student Test Session (e2e)', () => {
  let app: INestApplication<App>;
  let requestTestAgent: TestAgent;
  let tokenGeneratorService: TokenGeneratorService;
  let openRouterService: OpenRouterService;
  let generateQuestionsFromStoryPassageSpy: jest.SpyInstance<
    Promise<string[]>,
    [passage: string]
  >;
  let generateQuestionsForPreTestSpy: jest.SpyInstance<Promise<string[]>, []>;
  let randomUUIDV7: jest.SpyInstance<string, [length?: number | undefined]>;
  let randomNumericCode: jest.SpyInstance<
    string,
    [length?: number | undefined]
  >;

  beforeAll(async () => {
    app = await createTestingApp();
    requestTestAgent = request(app.getHttpServer());
  }, 15000);

  beforeEach(async () => {
    await clearDatabase(app);

    const mailService: MailService = app.get(MailService);
    jest
      .spyOn(mailService, 'sendFirstTimeWelcomeParentWithStudentEmail')
      .mockResolvedValue(undefined);
    jest
      .spyOn(mailService, 'sendStudentAccountInfoToParentEmail')
      .mockResolvedValue(undefined);

    tokenGeneratorService = app.get(TokenGeneratorService);
    randomUUIDV7 = jest.spyOn(tokenGeneratorService, 'randomUUIDV7');
    randomUUIDV7.mockReturnValue('1');
    randomNumericCode = jest.spyOn(tokenGeneratorService, 'numericCode');
    randomNumericCode.mockReturnValue('123456');

    openRouterService = app.get(OpenRouterService);
    generateQuestionsFromStoryPassageSpy = jest.spyOn(
      openRouterService,
      'generateQuestionsFromStoryPassage',
    );
    generateQuestionsFromStoryPassageSpy.mockResolvedValue([
      'Rafi 1',
      'Rafi 2',
      'Rafi 3',
      'Rafi 4',
    ]);
    generateQuestionsForPreTestSpy = jest.spyOn(
      openRouterService,
      'generateQuestionsForPreTest',
    );
    generateQuestionsForPreTestSpy.mockResolvedValue([
      'Rafi 1',
      'Rafi 2',
      'Rafi 3',
      'Rafi 4',
      'Rafi 5',
      'Rafi 6',
      'Rafi 7',
      'Rafi 8',
      'Rafi 9',
      'Rafi 10',
      'Rafi 11',
      'Rafi 12',
      'Rafi 13',
      'Rafi 14',
      'Rafi 15',
    ]);

    // Create a test teacher and student
    await requestTestAgent.post('/teachers').send({
      email: 'teacher1@gmail.com',
      username: 'teacher1',
      password: 'teacher1password',
      confirmPassword: 'teacher1password',
      fullName: 'Teacher One',
      schoolName: 'School Name 1',
    });
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const levelSeeder: LevelSeeder = new LevelSeeder(
      app.get<DataSource>(DataSource),
    );
    await levelSeeder.run();

    randomUUIDV7.mockReturnValue('2');
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student2',
        studentFullName: 'Student Two',
        parentEmail: 'parent2@gmail.com',
        parentFullName: 'Parent Two',
        jumpLevelTo: 1, // start at level 2
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // none
  });

  it('POST /students/test-sessions | must create a new TestSession if valid', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    const level3: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 3 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();
    expect(level3).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const body = response.body.data;
    expect(body).toBeDefined();
    expect(body.id).toBeDefined();
    expect(body.levelFullName).toBe(level2!.fullName);
    expect(body.story.id).toBe(level2!.stories[0].id);
    expect(body.titleAtTaken).toBe(level2!.stories[0].title);
    expect(body.imageAtTaken).toBe(level2!.stories[0].image);
    expect(body.imageAtTakenUrl).toBe(
      level2!.stories[0].image
        ? `${process.env.APP_URL}${level2!.stories[0].image}`
        : null,
    );
    expect(body.descriptionAtTaken).toBe(level2!.stories[0].description);
    expect(body.passageAtTaken).toBe(level2!.stories[0].passage);
    expect(body.passagesAtTaken).toStrictEqual(
      Story.passageToSentences(level2!.stories[0].passage),
    );
    expect(body.finishedAt).toBeNull();
    expect(body.remainingTimeInSeconds).toBeGreaterThan(7100);
    expect(body.remainingTimeInSeconds).toBeLessThan(7202);
    expect(body.medal).toBeNull();
    expect(body.score).toBeNull();
    expect(body.isCompleted).toBe(false);
  });

  it('POST /students/test-sessions | must reject if stories is in locked level', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    const level3: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 3 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();
    expect(level3).not.toBeNull();

    await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level3!.stories[0].id, // level 3 is locked
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /students/test-sessions | must reject create a new TestSession if not authenticated ', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: 10,
      })
      .set('Authorization', `Bearer ${token}+invalid`)
      .expect(401);
  });

  it('GET /students/test-sessions/:id/status | must return and handle a valid TestSession', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    const level3: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 3 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();
    expect(level3).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const body = response.body.data;
    expect(body).toBeDefined();
    expect(body.id).toBeDefined();
    expect(body.levelFullName).toBe(level2!.fullName);
    expect(body.story.id).toBe(level2!.stories[0].id);
    expect(body.titleAtTaken).toBe(level2!.stories[0].title);
    expect(body.imageAtTaken).toBe(level2!.stories[0].image);
    expect(body.imageAtTakenUrl).toBe(
      level2!.stories[0].image
        ? `${process.env.APP_URL}${level2!.stories[0].image}`
        : null,
    );
    expect(body.descriptionAtTaken).toBe(level2!.stories[0].description);
    expect(body.passageAtTaken).toBe(level2!.stories[0].passage);
    expect(body.passagesAtTaken).toStrictEqual(
      Story.passageToSentences(level2!.stories[0].passage),
    );
    expect(body.finishedAt).toBeNull();
    expect(body.remainingTimeInSeconds).toBeGreaterThan(7100);
    expect(body.remainingTimeInSeconds).toBeLessThan(7202);
    expect(body.medal).toBeNull();
    expect(body.score).toBeNull();
    expect(body.isCompleted).toBe(false);

    const testSessionId = body.id;

    const statusResponse = await requestTestAgent
      .get(`/students/test-sessions/${testSessionId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const statusBody = statusResponse.body.data;
    expect(statusBody).toBeDefined();
    expect(statusBody.id).toBe(testSessionId);
    expect(statusBody.levelFullName).toBe(level2!.fullName);
    expect(statusBody.story.id).toBe(level2!.stories[0].id);
    expect(statusBody.titleAtTaken).toBe(level2!.stories[0].title);
    expect(statusBody.imageAtTaken).toBe(level2!.stories[0].image);
    expect(statusBody.imageAtTakenUrl).toBe(
      level2!.stories[0].image
        ? `${process.env.APP_URL}${level2!.stories[0].image}`
        : null,
    );
    expect(statusBody.descriptionAtTaken).toBe(level2!.stories[0].description);
    expect(statusBody.passageAtTaken).toBe(level2!.stories[0].passage);
    expect(statusBody.passagesAtTaken).toStrictEqual(
      Story.passageToSentences(level2!.stories[0].passage),
    );
    expect(statusBody.finishedAt).toBeNull();
    expect(statusBody.remainingTimeInSeconds).toBeGreaterThan(7000);
    expect(statusBody.remainingTimeInSeconds).toBeLessThan(7205);
    expect(statusBody.medal).toBeNull();
    expect(statusBody.score).toBeNull();
    expect(statusBody.isCompleted).toBe(false);
  });

  it('GET /students/test-sessions/:id/status || GET /students/test-sessions/:id | must return and handle a completed TestSession', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    const level3: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 3 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();
    expect(level3).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const body = response.body.data;
    const testSessionId = body.id;

    await app
      .get<DataSource>(DataSource)
      .getRepository(TestSession)
      .update(
        { id: testSessionId },
        {
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // started 3 hours ago
        },
      );

    await requestTestAgent
      .get(`/students/test-sessions/${testSessionId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    const testSessionAfter: TestSession | null = await app
      .get<DataSource>(DataSource)
      .getRepository(TestSession)
      .findOne({ where: { id: testSessionId } });
    expect(testSessionAfter).not.toBeNull();
    expect(testSessionAfter!.finishedAt).not.toBeNull();
    expect(testSessionAfter!.remainingTimeInSeconds).toBe(0);

    const testSessionResponseAfter = await requestTestAgent
      .get(`/students/test-sessions/${testSessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const statusBody = testSessionResponseAfter.body.data;
    expect(statusBody).toBeDefined();
    expect(statusBody.id).toBe(testSessionId);
    expect(statusBody.levelFullName).toBe(level2!.fullName);
    expect(statusBody.story.id).toBe(level2!.stories[0].id);
    expect(statusBody.titleAtTaken).toBe(level2!.stories[0].title);
    expect(statusBody.imageAtTaken).toBe(level2!.stories[0].image);
    expect(statusBody.imageAtTakenUrl).toBe(
      level2!.stories[0].image
        ? `${process.env.APP_URL}${level2!.stories[0].image}`
        : null,
    );
    expect(statusBody.descriptionAtTaken).toBe(level2!.stories[0].description);
    expect(statusBody.passageAtTaken).toBe(level2!.stories[0].passage);
    expect(statusBody.passagesAtTaken).toStrictEqual(
      Story.passageToSentences(level2!.stories[0].passage),
    );
    expect(statusBody.finishedAt).not.toBeNull();
    expect(statusBody.remainingTimeInSeconds).toBe(0);
    expect(statusBody.medal).toBeNull();
    expect(statusBody.score).toBeNull();
    expect(statusBody.isCompleted).toBe(true);
  });

  it('POST /students/test-sessions/:id/stt-questions | must create STT questions for a valid test session', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    expect(sttQuestions).toBeDefined();
    expect(Array.isArray(sttQuestions)).toBe(true);
    expect(sttQuestions.length).toBeGreaterThan(0);
  });

  it('POST /students/test-sessions/:id/stt-questions | must reject if test session is already finished', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Mark the test session as finished
    await app
      .get<DataSource>(DataSource)
      .getRepository(TestSession)
      .update(
        { id: testSessionId },
        {
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // started 3 hours ago
          finishedAt: new Date(),
        },
      );

    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /students/test-sessions/:id/stt-questions | must reject if STT questions already started', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions once
    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Try to start again - should fail
    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /students/test-sessions/:id/stt-questions | must reject if not authenticated', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('POST /students/test-sessions/:id/stt-questions | must reject if test session not found', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    await requestTestAgent
      .post(`/students/test-sessions/TESTSESSION-nonexistent/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must successfully answer an STT question', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Answer the first question
    const answerResponse = await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'Test answer',
        accuracy: 85.5,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const answeredQuestion = answerResponse.body.data;
    expect(answeredQuestion).toBeDefined();
    expect(answeredQuestion.id).toBe(firstQuestion.id);
    expect(answeredQuestion.expectedWord).toBe(firstQuestion.expectedWord);
    expect(answeredQuestion.spokenWord).toBe('Test answer');
    expect(answeredQuestion.accuracy).toBe(85.5);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject if test session is already finished', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Mark the test session as finished
    await app
      .get<DataSource>(DataSource)
      .getRepository(TestSession)
      .update(
        { id: testSessionId },
        {
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // started 3 hours ago
          finishedAt: new Date(),
        },
      );

    // Try to answer after test session is finished
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'Test answer',
        accuracy: 85.5,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject if time has expired', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Mark the test session as started 3 hours ago (time expired)
    await app
      .get<DataSource>(DataSource)
      .getRepository(TestSession)
      .update(
        { id: testSessionId },
        {
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
      );

    // Try to answer after time expired
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'Test answer',
        accuracy: 85.5,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject if STT question not found', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Try to answer a non-existent question
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/STTWORDRESULT-nonexistent/answer`,
      )
      .send({
        spokenWord: 'Test answer',
        accuracy: 85.5,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject if STT question already answered', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Answer the question once
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'First answer',
        accuracy: 85.5,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Try to answer the same question again
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'Second answer',
        accuracy: 90.0,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject if not authenticated', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Try to answer without authentication
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'Test answer',
        accuracy: 85.5,
      })
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject if student tries to answer another student STT question', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    // Student 2 creates a test session and starts STT questions
    const student2SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const student2Token = student2SignInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Student 1 tries to answer Student 2's STT question
    const student1SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const student1Token = student1SignInResponse.body.data.token;

    // Should be rejected (403 since it doesn't belong to student1)
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'Test answer',
        accuracy: 85.5,
      })
      .set('Authorization', `Bearer ${student1Token}`)
      .expect(404);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject with invalid data - missing spokenWord', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Try to answer without spokenWord
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        accuracy: 85.5,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject with invalid data - missing accuracy', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Try to answer without accuracy
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'Test answer',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('POST /students/test-sessions/:id/stt-questions/:stt-id/answer | must reject with invalid data - negative accuracy', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    const firstQuestion = sttQuestions[0];

    // Try to answer with negative accuracy
    await requestTestAgent
      .post(
        `/students/test-sessions/${testSessionId}/stt-questions/${firstQuestion.id}/answer`,
      )
      .send({
        spokenWord: 'Test answer',
        accuracy: -10,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /students/test-sessions/:id | must reject if student tries to access another student test session', async () => {
    // Student 2 creates a test session
    const student2SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const student2Token = student2SignInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Student 1 tries to access Student 2's test session
    const student1SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const student1Token = student1SignInResponse.body.data.token;

    // Should be rejected (404 since it doesn't belong to student1)
    await requestTestAgent
      .get(`/students/test-sessions/${testSessionId}`)
      .set('Authorization', `Bearer ${student1Token}`)
      .expect(404);
  });

  it('GET /students/test-sessions/:id/status | must reject if student tries to access another student test session', async () => {
    // Student 2 creates a test session
    const student2SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const student2Token = student2SignInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Student 1 tries to access Student 2's test session status
    const student1SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const student1Token = student1SignInResponse.body.data.token;

    // Should be rejected (404 since it doesn't belong to student1)
    await requestTestAgent
      .get(`/students/test-sessions/${testSessionId}/status`)
      .set('Authorization', `Bearer ${student1Token}`)
      .expect(404);
  });

  it('POST /students/test-sessions/:id/stt-questions | must reject if student tries to access another student test session', async () => {
    // Student 2 creates a test session
    const student2SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const student2Token = student2SignInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Student 1 tries to start STT questions on Student 2's test session
    const student1SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const student1Token = student1SignInResponse.body.data.token;

    // Should be rejected (404 since it doesn't belong to student1)
    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${student1Token}`)
      .expect(404);
  });

  it('POST /students/test-sessions/:id/finish | must successfully finish a valid test session', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    const finishResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const finishedSession = finishResponse.body.data;
    expect(finishedSession).toBeDefined();
    expect(finishedSession.id).toBe(testSessionId);
    expect(finishedSession.finishedAt).not.toBeNull();
    expect(finishedSession.isCompleted).toBe(true);
    expect(finishedSession.levelFullName).toBe(level2!.fullName);
    expect(finishedSession.story.id).toBe(level2!.stories[0].id);
  });

  it('POST /students/test-sessions/:id/finish | must reject if test session is already finished', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Finish the test session once
    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Try to finish again - should fail
    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('POST /students/test-sessions/:id/finish | must reject if test session not found', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    await requestTestAgent
      .post(`/students/test-sessions/TESTSESSION-nonexistent/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /students/test-sessions/:id/finish | must reject if not authenticated', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('POST /students/test-sessions/:id/finish | must reject if student tries to finish another student test session', async () => {
    // Student 2 creates a test session
    const student2SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const student2Token = student2SignInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Student 1 tries to finish Student 2's test session
    const student1SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const student1Token = student1SignInResponse.body.data.token;

    // Should be rejected (404 since it doesn't belong to student1)
    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', `Bearer ${student1Token}`)
      .expect(404);
  });

  it('POST /students/test-sessions/:id/finish | must finish test session even if time has expired', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Mark the test session as started 3 hours ago (time expired)
    await app
      .get<DataSource>(DataSource)
      .getRepository(TestSession)
      .update(
        { id: testSessionId },
        {
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // started 3 hours ago
        },
      );

    // Should still be able to finish
    const finishResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const finishedSession = finishResponse.body.data;
    expect(finishedSession).toBeDefined();
    expect(finishedSession.id).toBe(testSessionId);
    expect(finishedSession.finishedAt).not.toBeNull();
    expect(finishedSession.isCompleted).toBe(true);
    expect(finishedSession.remainingTimeInSeconds).toBe(0);
  });

  it('POST /students/test-sessions/:id/finish | must reject if user is not a student', async () => {
    // Create a test session first with student2
    const student2SignInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const student2Token = student2SignInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Teacher tries to finish the test session
    const teacherSignInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const teacherToken = teacherSignInResponse.body.data.token;

    await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(403);
  });

  it('POST /students/test-sessions/:id/finish | must unlock next level when current level is completed', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    const levelsResponse = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levels = levelsResponse.body.data;
    const level1 = levels.find((l: any) => l.no === 1);
    const level2 = levels.find((l: any) => l.no === 2);

    expect(level1.isUnlocked).toBe(true);
    expect(level2.isUnlocked).toBe(false); // Level 2 should be locked initially

    // Get all stories from level 1
    const level1Stories = level1.stories;

    // Complete enough test sessions to unlock level 2
    // We need to get 5 medals (requiredPoints for level 1)
    for (let i = 0; i < Math.min(level1Stories.length, 5); i++) {
      const story = level1Stories[i];

      // Create test session
      const testSessionResponse = await requestTestAgent
        .post(`/students/test-sessions`)
        .send({
          storyId: story.id,
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const testSessionId = testSessionResponse.body.data.id;
      // Start STT questions (to simulate completing the test)
      await requestTestAgent
        .post(`/students/test-sessions/${testSessionId}/stt-questions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      // Manually set some accuracy for STT results to ensure we get a medal
      const sttResults = await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .find({
          where: { testSession: { id: testSessionId } },
        });

      for (const result of sttResults as any[]) {
        await app
          .get<DataSource>(DataSource)
          .getRepository(STTWordResult)

          .update(result.id, { accuracy: 100 }); // Set accuracy to 80% to get gold medal
      }

      // Finish test session
      await requestTestAgent
        .post(`/students/test-sessions/${testSessionId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    }

    // Check levels again - level 2 should now be unlocked
    const levelsResponseAfter = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levelsAfter = levelsResponseAfter.body.data;

    const level1After = levelsAfter.find((l: any) => l.no === 1);

    const level2After = levelsAfter.find((l: any) => l.no === 2);

    expect(level1After.isCompleted).toBe(true); // Level 1 should be completed
    expect(level2After.isUnlocked).toBe(true); // Level 2 should be unlocked
  });

  it('POST /students/test-sessions/:id/finish | must replace medal count with higher medal when retaking the same story and got the higher medal', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    const levelsResponse = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levels = levelsResponse.body.data;
    const level1 = levels.find((l: any) => l.no === 1);
    expect(level1.isUnlocked).toBe(true);
    expect(level1.maxPoints).toBe(15);

    const story1 = level1.stories[0];

    // First attempt - get bronze medal
    const firstTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const firstTestSessionId = firstTestResponse.body.data.id;

    // Start STT questions for first test
    await requestTestAgent
      .post(`/students/test-sessions/${firstTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const firstSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: firstTestSessionId } },
      });

    for (const result of firstSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { accuracy: 49 });
    }

    // Finish first test session
    await requestTestAgent
      .post(`/students/test-sessions/${firstTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Check level progress after first test
    const levelsAfterFirst = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterFirst = levelsAfterFirst.body.data.find(
      (l: any) => l.no === 1,
    );
    expect(level1AfterFirst.requiredPoints).toBe(10);
    expect(level1AfterFirst.isCompleted).toBe(false);
    expect(level1AfterFirst.bronzeCount).toBe(0);
    expect(level1AfterFirst.silverCount).toBe(1);
    expect(level1AfterFirst.goldCount).toBe(0);

    // Second attempt - get gold medal on the same story
    const secondTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const secondTestSessionId = secondTestResponse.body.data.id;

    // Start STT questions for second test
    await requestTestAgent
      .post(`/students/test-sessions/${secondTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Set high accuracy for gold medal (80%)
    const secondSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: secondTestSessionId } },
      });

    for (const result of secondSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { accuracy: 80 }); // 80% accuracy for gold
    }

    // Finish second test session
    await requestTestAgent
      .post(`/students/test-sessions/${secondTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Check level progress after second test - bronze should be 0, gold should be 1
    const levelsAfterSecond = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterSecond = levelsAfterSecond.body.data.find(
      (l: any) => l.no === 1,
    );
    expect(level1AfterSecond.requiredPoints).toBe(9); // 12 - 3
    expect(level1AfterSecond.bronzeCount).toBe(0); // Bronze replaced
    expect(level1AfterSecond.silverCount).toBe(0);
    expect(level1AfterSecond.goldCount).toBe(1); // Gold added
  });

  it('POST /students/test-sessions/:id/finish | must not replace medal count with lower medal when retaking the same story and got the lower medal', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    const levelsResponse = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levels = levelsResponse.body.data;
    const level1 = levels.find((l: any) => l.no === 1);
    expect(level1.isUnlocked).toBe(true);

    const story1 = level1.stories[0];

    // First attempt - get silver medal
    const firstTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const firstTestSessionId = firstTestResponse.body.data.id;

    // Start STT questions for first test
    await requestTestAgent
      .post(`/students/test-sessions/${firstTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Set low accuracy for gold medal (90%)
    const firstSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: firstTestSessionId } },
      });

    for (const result of firstSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { accuracy: 90 }); // 51% accuracy for gold
    }

    // Finish first test session
    await requestTestAgent
      .post(`/students/test-sessions/${firstTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Check level progress after first test
    const levelsAfterFirst = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterFirst = levelsAfterFirst.body.data.find(
      (l: any) => l.no === 1,
    );
    expect(level1AfterFirst.progress).toBe(20);
    expect(level1AfterFirst.requiredPoints).toBe(9);
    expect(level1AfterFirst.isCompleted).toBe(false);
    expect(level1AfterFirst.bronzeCount).toBe(0);
    expect(level1AfterFirst.silverCount).toBe(0);
    expect(level1AfterFirst.goldCount).toBe(1);

    // Second attempt - get bronze medal on the same story
    const secondTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const secondTestSessionId = secondTestResponse.body.data.id;

    // Start STT questions for second test
    await requestTestAgent
      .post(`/students/test-sessions/${secondTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Set high accuracy for bronze medal (<50%)
    const secondSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: secondTestSessionId } },
      });

    for (const result of secondSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { accuracy: 49 }); // 49% accuracy for bronze
    }

    // Finish second test session
    await requestTestAgent
      .post(`/students/test-sessions/${secondTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Check level progress after second test - bronze should be 0, gold should remain 1
    const levelsAfterSecond = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterSecond = levelsAfterSecond.body.data.find(
      (l: any) => l.no === 1,
    );

    expect(level1AfterSecond.progress).toBe(20);
    expect(level1AfterSecond.requiredPoints).toBe(9); // 12 - 3
    expect(level1AfterSecond.bronzeCount).toBe(0);
    expect(level1AfterSecond.silverCount).toBe(0);
    expect(level1AfterSecond.goldCount).toBe(1); // Gold remains

    // third attempt - get silver medal on the same story
    const thirdTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const thirdTestSessionId = thirdTestResponse.body.data.id;

    // Start STT questions for third test
    await requestTestAgent
      .post(`/students/test-sessions/${thirdTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Set high accuracy for silver medal (51%)
    const thirdSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: thirdTestSessionId } },
      });

    for (const result of thirdSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { accuracy: 51 }); // 51% accuracy for silver
    }

    // Finish second test session
    await requestTestAgent
      .post(`/students/test-sessions/${thirdTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Check level progress after second test - bronze should be 0, gold should remain 1
    const levelsAfterThird = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterThird = levelsAfterThird.body.data.find(
      (l: any) => l.no === 1,
    );

    expect(level1AfterThird.progress).toBe(20);
    expect(level1AfterThird.requiredPoints).toBe(9); // 12 - 3
    expect(level1AfterThird.bronzeCount).toBe(0);
    expect(level1AfterThird.silverCount).toBe(0);
    expect(level1AfterThird.goldCount).toBe(1); // Gold remains

    // fourth attempt - get silver medal on the same story
    const fourthTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const fourthTestSessionId = fourthTestResponse.body.data.id;

    // Start STT questions for third fourth
    await requestTestAgent
      .post(`/students/test-sessions/${fourthTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Set high accuracy for gold medal (100%)
    const fourthSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: fourthTestSessionId } },
      });

    for (const result of fourthSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { accuracy: 100 }); // 100% accuracy for gold
    }

    // Finish second test session
    await requestTestAgent
      .post(`/students/test-sessions/${fourthTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Check level progress after second test - bronze should be 0, gold should remain 1
    const levelsAfterFourth = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterFourth = levelsAfterFourth.body.data.find(
      (l: any) => l.no === 1,
    );

    expect(level1AfterFourth.progress).toBe(20);
    expect(level1AfterFourth.requiredPoints).toBe(9); // 12 - 3
    expect(level1AfterFourth.bronzeCount).toBe(0);
    expect(level1AfterFourth.silverCount).toBe(0);
    expect(level1AfterFourth.goldCount).toBe(1); // Gold remains
  });

  it('must complete full flow: start STT questions, answer all, finish, and calculate correct medal and points', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 2 },
        relations: ['stories'],
      });
    expect(level2).not.toBeNull();

    // Create a new test session
    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level2!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    expect(sttQuestions).toBeDefined();
    expect(Array.isArray(sttQuestions)).toBe(true);
    expect(sttQuestions.length).toBeGreaterThan(0);

    // Answer all STT questions with high accuracy (for gold medal - 80%+)
    for (let i = 0; i < sttQuestions.length; i++) {
      const question = sttQuestions[i];
      const accuracy = 85 + Math.random() * 10; // Random between 85-95%

      const answerResponse = await requestTestAgent
        .post(
          `/students/test-sessions/${testSessionId}/stt-questions/${question.id}/answer`,
        )
        .send({
          spokenWord: question.expectedWord, // Use the expected word for realistic test
          accuracy: accuracy,
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const answeredQuestion = answerResponse.body.data;
      expect(answeredQuestion).toBeDefined();
      expect(answeredQuestion.id).toBe(question.id);
      expect(answeredQuestion.spokenWord).toBe(question.expectedWord);
      expect(answeredQuestion.accuracy).toBeCloseTo(accuracy, 2);
    }

    // Finish the test session
    const finishResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const finishedSession = finishResponse.body.data;
    expect(finishedSession).toBeDefined();
    expect(finishedSession.id).toBe(testSessionId);
    expect(finishedSession.finishedAt).not.toBeNull();
    expect(finishedSession.isCompleted).toBe(true);

    // Verify the medal is gold (since all answers were 85%+ accuracy)
    expect(finishedSession.medal).toBe(StoryMedal.GOLD);
    expect(finishedSession.score).toBeGreaterThanOrEqual(80);

    // Check level progress - should have 1 gold medal and 0 required points (5 - 3 for gold)
    const levelsAfter = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level2After = levelsAfter.body.data.find((l: any) => l.no === 2);
    expect(level2After).toBeDefined();
    expect(level2After.goldCount).toBe(1);
    expect(level2After.silverCount).toBe(0);
    expect(level2After.bronzeCount).toBe(0);
    expect(level2After.requiredPoints).toBe(2); // 5 - 3 (gold medal points)
    expect(level2After.isCompleted).toBe(false);
  });

  it('must complete full flow of pre-test: start STT questions, answer all, finish, and calculate correct medal and points, calculate correct level skipped', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student2',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level0: Level | null = await app
      .get<DataSource>(DataSource)
      .getRepository(Level)
      .findOne({
        where: { no: 0 },
        relations: ['stories'],
      });
    expect(level0).not.toBeNull();

    // Create a new test session
    const response = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: level0!.stories[0].id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const testSessionId = response.body.data.id;

    // Start STT questions
    const sttResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const sttQuestions = sttResponse.body.data;
    expect(sttQuestions).toBeDefined();
    expect(Array.isArray(sttQuestions)).toBe(true);
    expect(sttQuestions.length).toBe(15);

    // Answer all STT questions
    for (let i = 0; i < sttQuestions.length; i++) {
      const question = sttQuestions[i];
      const accuracy = 20 + Math.random() * 5; // Random between 20-25%

      const answerResponse = await requestTestAgent
        .post(
          `/students/test-sessions/${testSessionId}/stt-questions/${question.id}/answer`,
        )
        .send({
          spokenWord: question.expectedWord, // Use the expected word for realistic test
          accuracy: accuracy,
        })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const answeredQuestion = answerResponse.body.data;
      expect(answeredQuestion).toBeDefined();
      expect(answeredQuestion.id).toBe(question.id);
      expect(answeredQuestion.spokenWord).toBe(question.expectedWord);
      expect(answeredQuestion.accuracy).toBeCloseTo(accuracy, 2);
    }

    // Finish the test session
    const finishResponse = await requestTestAgent
      .post(`/students/test-sessions/${testSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const finishedSession = finishResponse.body.data;
    expect(finishedSession).toBeDefined();
    expect(finishedSession.id).toBe(testSessionId);
    expect(finishedSession.finishedAt).not.toBeNull();
    expect(finishedSession.isCompleted).toBe(true);

    // Verify the medal is silver (40% stt but no distraction)
    expect(finishedSession.medal).toBe(StoryMedal.SILVER);
    expect(finishedSession.score).toBeGreaterThanOrEqual(40);

    const levelsAfter = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level0After = levelsAfter.body.data.find((l: any) => l.no === 0);
    expect(level0After).toBeDefined();
    expect(level0After.goldCount).toBe(0);
    expect(level0After.silverCount).toBe(1);
    expect(level0After.bronzeCount).toBe(0);
    expect(level0After.requiredPoints).toBe(1); // 3 - 2 (silver medal points)
    expect(level0After.isCompleted).toBe(false);

    // Should be skipped levels, 40 scored is jumped to level 3, level 2 and 1 is skipped
    const level1After = levelsAfter.body.data.find((l: any) => l.no === 1);
    expect(level1After).toBeDefined();
    expect(level1After.isUnlocked).toBe(true);
    expect(level1After.isSkipped).toBe(true);
    expect(level1After.progress).toBe(100);
    expect(level1After.goldCount).toBe(0);
    expect(level1After.silverCount).toBe(0);
    expect(level1After.bronzeCount).toBe(0);
    expect(level1After.isCompleted).toBe(true);

    const level2After = levelsAfter.body.data.find((l: any) => l.no === 2);
    expect(level2After).toBeDefined();
    expect(level2After.isUnlocked).toBe(true);
    expect(level2After.isSkipped).toBe(true);
    expect(level2After.progress).toBe(100);
    expect(level2After.goldCount).toBe(0);
    expect(level2After.silverCount).toBe(0);
    expect(level2After.bronzeCount).toBe(0);
    expect(level2After.isCompleted).toBe(true);

    const level3After = levelsAfter.body.data.find((l: any) => l.no === 3);
    expect(level3After).toBeDefined();
    expect(level3After.isUnlocked).toBe(true);
    expect(level3After.isSkipped).toBe(false);
    expect(level3After.progress).toBe(0);
    expect(level3After.goldCount).toBe(0);
    expect(level3After.silverCount).toBe(0);
    expect(level3After.bronzeCount).toBe(0);
    expect(level3After.isCompleted).toBe(false);
  });

  it('POST /students/test-sessions/:id/finish | must not duplicate medal count when retaking story: gold → silver → gold scenario', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    const levelsResponse = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levels = levelsResponse.body.data;
    const level1 = levels.find((l: any) => l.no === 1);
    expect(level1.isUnlocked).toBe(true);

    const story1 = level1.stories[0];

    // First attempt - get GOLD medal (85%)
    const firstTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const firstTestSessionId = firstTestResponse.body.data.id;

    await requestTestAgent
      .post(`/students/test-sessions/${firstTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const firstSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: firstTestSessionId } },
      });

    for (const result of firstSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { spokenWord: 'test', accuracy: 85 });
    }

    await requestTestAgent
      .post(`/students/test-sessions/${firstTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levelsAfterFirst = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterFirst = levelsAfterFirst.body.data.find(
      (l: any) => l.no === 1,
    );
    expect(level1AfterFirst.goldCount).toBe(1);
    expect(level1AfterFirst.silverCount).toBe(0);
    expect(level1AfterFirst.bronzeCount).toBe(0);

    // Second attempt - get SILVER medal (65%)
    const secondTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const secondTestSessionId = secondTestResponse.body.data.id;

    await requestTestAgent
      .post(`/students/test-sessions/${secondTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const secondSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: secondTestSessionId } },
      });

    for (const result of secondSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { spokenWord: 'test', accuracy: 65 });
    }

    await requestTestAgent
      .post(`/students/test-sessions/${secondTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levelsAfterSecond = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterSecond = levelsAfterSecond.body.data.find(
      (l: any) => l.no === 1,
    );
    // Should still have only gold (not silver), because gold is better
    expect(level1AfterSecond.goldCount).toBe(1);
    expect(level1AfterSecond.silverCount).toBe(0);
    expect(level1AfterSecond.bronzeCount).toBe(0);

    // Third attempt - get GOLD again (90%)
    const thirdTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const thirdTestSessionId = thirdTestResponse.body.data.id;

    await requestTestAgent
      .post(`/students/test-sessions/${thirdTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const thirdSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: thirdTestSessionId } },
      });

    for (const result of thirdSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { spokenWord: 'test', accuracy: 90 });
    }

    await requestTestAgent
      .post(`/students/test-sessions/${thirdTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levelsAfterThird = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterThird = levelsAfterThird.body.data.find(
      (l: any) => l.no === 1,
    );
    // Should STILL have only goldCount = 1 (not 2!)
    expect(level1AfterThird.goldCount).toBe(1);
    expect(level1AfterThird.silverCount).toBe(0);
    expect(level1AfterThird.bronzeCount).toBe(0);
  });

  it('POST /students/test-sessions/:id/finish | must not duplicate medal count when retaking story: gold → bronze → silver scenario', async () => {
    randomUUIDV7.mockRestore();
    randomNumericCode.mockRestore();
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // to populate the level progresses
    const levelsResponse = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levels = levelsResponse.body.data;
    const level1 = levels.find((l: any) => l.no === 1);
    expect(level1.isUnlocked).toBe(true);

    const story1 = level1.stories[0];

    // First attempt - get GOLD medal (85%)
    const firstTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const firstTestSessionId = firstTestResponse.body.data.id;

    await requestTestAgent
      .post(`/students/test-sessions/${firstTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const firstSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: firstTestSessionId } },
      });

    for (const result of firstSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { spokenWord: 'test', accuracy: 85 });
    }

    await requestTestAgent
      .post(`/students/test-sessions/${firstTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levelsAfterFirst = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterFirst = levelsAfterFirst.body.data.find(
      (l: any) => l.no === 1,
    );
    expect(level1AfterFirst.goldCount).toBe(1);
    expect(level1AfterFirst.silverCount).toBe(0);
    expect(level1AfterFirst.bronzeCount).toBe(0);

    // Second attempt - get BRONZE medal (45%)
    const secondTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const secondTestSessionId = secondTestResponse.body.data.id;

    await requestTestAgent
      .post(`/students/test-sessions/${secondTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const secondSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: secondTestSessionId } },
      });

    for (const result of secondSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { spokenWord: 'test', accuracy: 45 });
    }

    await requestTestAgent
      .post(`/students/test-sessions/${secondTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levelsAfterSecond = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterSecond = levelsAfterSecond.body.data.find(
      (l: any) => l.no === 1,
    );
    // Should still have only gold (not bronze), because gold is better
    expect(level1AfterSecond.goldCount).toBe(1);
    expect(level1AfterSecond.silverCount).toBe(0);
    expect(level1AfterSecond.bronzeCount).toBe(0);

    // Third attempt - get SILVER medal (65%)
    const thirdTestResponse = await requestTestAgent
      .post(`/students/test-sessions`)
      .send({
        storyId: story1.id,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const thirdTestSessionId = thirdTestResponse.body.data.id;

    await requestTestAgent
      .post(`/students/test-sessions/${thirdTestSessionId}/stt-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const thirdSttResults = await app
      .get<DataSource>(DataSource)
      .getRepository(STTWordResult)
      .find({
        where: { testSession: { id: thirdTestSessionId } },
      });

    for (const result of thirdSttResults as any[]) {
      await app
        .get<DataSource>(DataSource)
        .getRepository(STTWordResult)
        .update(result.id, { spokenWord: 'test', accuracy: 65 });
    }

    await requestTestAgent
      .post(`/students/test-sessions/${thirdTestSessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const levelsAfterThird = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const level1AfterThird = levelsAfterThird.body.data.find(
      (l: any) => l.no === 1,
    );
    // Should STILL have only goldCount = 1, NOT silverCount = 1!
    expect(level1AfterThird.goldCount).toBe(1);
    expect(level1AfterThird.silverCount).toBe(0);
    expect(level1AfterThird.bronzeCount).toBe(0);
  });
});
