/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { MailService } from 'src/common/mail/mail.service';
import { TokenGeneratorService } from 'src/common/token-generator/token-generator.service';
import { LevelSeeder } from 'src/database/seeders/level.seeder';
import { Story } from 'src/feature/levels/entities/story.entity';
import { StoryMedal } from 'src/feature/levels/enum/story-medal.enum';
import { STTWordResult } from 'src/feature/test-session/entities/stt-word-result.entity';
import { TestSession } from 'src/feature/test-session/entities/test-session.entity';
import { Student } from 'src/feature/users/entities/student.entity';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import createTestingApp from '../../utils/create-testing-app.utils';
import { clearDatabase } from '../../utils/testing-database.utils';

describe('Parent Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let requestTestAgent: TestAgent;
  let dataSource: DataSource;
  let parentToken: string;
  let parent2Token: string;
  let studentId: string;
  let student2Id: string;
  let tokenGeneratorService: TokenGeneratorService;

  beforeAll(async () => {
    app = await createTestingApp();
    requestTestAgent = request(app.getHttpServer());
    dataSource = app.get<DataSource>(DataSource);
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
    const randomUUIDV7 = jest.spyOn(tokenGeneratorService, 'randomUUIDV7');
    randomUUIDV7.mockReturnValue('1');
    const randomNumericCode = jest.spyOn(tokenGeneratorService, 'numericCode');
    randomNumericCode.mockReturnValue('123456');

    // Create teacher
    await requestTestAgent.post('/teachers').send({
      email: 'teacher1@gmail.com',
      username: 'teacher1',
      password: 'teacher1password',
      confirmPassword: 'teacher1password',
      fullName: 'Teacher One',
      schoolName: 'School Name 1',
    });

    const teacherSignIn = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      });
    const teacherToken = teacherSignIn.body.data.token;

    // Seed levels
    const levelSeeder: LevelSeeder = new LevelSeeder(dataSource);
    await levelSeeder.run();

    // Create students for parent 1
    randomUUIDV7.mockReturnValue('STUDENT1');
    const student1Response = await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${teacherToken}`);
    studentId = student1Response.body.data.id;

    randomUUIDV7.mockReturnValue('STUDENT2');
    randomNumericCode.mockReturnValue('234567');
    const student2Response = await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student2',
        studentFullName: 'Student Two',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${teacherToken}`);
    student2Id = student2Response.body.data.id;

    // Sign in as parent 1
    const parent1SignIn = await requestTestAgent
      .post('/auth/parents/login')
      .send({
        email: 'parent1@gmail.com',
        password: '123456',
      });
    parentToken = parent1SignIn.body.data.token;

    // Create student for parent 2
    randomUUIDV7.mockReturnValue('STUDENT3');
    randomNumericCode.mockReturnValue('345678');
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student3',
        studentFullName: 'Student Three',
        parentEmail: 'parent2@gmail.com',
        parentFullName: 'Parent Two',
      })
      .set('Authorization', `Bearer ${teacherToken}`);

    // Sign in as parent 2
    const parent2SignIn = await requestTestAgent
      .post('/auth/parents/login')
      .send({
        email: 'parent2@gmail.com',
        password: '345678',
      });
    parent2Token = parent2SignIn.body.data.token;

    randomUUIDV7.mockReset();
    randomNumericCode.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /parents/dashboard/overview', () => {
    it('should return dashboard overview with statistics', async () => {
      const response = await requestTestAgent
        .get('/parents/dashboard/overview')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const body = response.body.data;
      expect(body).toHaveProperty('totalStudents', 2);
      expect(body).toHaveProperty('totalTestSessions', 0);
      expect(body).toHaveProperty('completedTestSessions', 0);
      expect(body).toHaveProperty('inProgressTestSessions', 0);
      expect(body).toHaveProperty('averageScore', 0);
      expect(body).toHaveProperty('testSessions');
      expect(Array.isArray(body.testSessions)).toBe(true);
      expect(body.testSessions.length).toBe(0);
    });

    it('should return correct statistics with test sessions', async () => {
      // Create test sessions
      const storyRepo = dataSource.getRepository(Story);
      const story = await storyRepo.findOne({ where: {} });
      const testSessionRepo = dataSource.getRepository(TestSession);
      const sttWordResultRepo = dataSource.getRepository(STTWordResult);

      // Completed test session for child 1
      const testSession1 = testSessionRepo.create({
        id: 'TESTSESSION-1',
        student: { id: studentId } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-01'),
        finishedAt: new Date('2025-01-01'),
        score: 75,
        medal: StoryMedal.SILVER,
      });
      await testSessionRepo.save(testSession1);

      // Add STT word results
      const sttResult1 = sttWordResultRepo.create({
        id: 'STT-1',
        testSession: testSession1,
        expectedWord: 'hello',
        spokenWord: 'hello',
        accuracy: 100,
      });
      await sttWordResultRepo.save(sttResult1);

      // Completed test session for child 2
      const testSession2 = testSessionRepo.create({
        id: 'TESTSESSION-2',
        student: { id: student2Id } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-02'),
        finishedAt: new Date('2025-01-02'),
        score: 90,
        medal: StoryMedal.GOLD,
      });
      await testSessionRepo.save(testSession2);

      // In-progress test session
      const testSession3 = testSessionRepo.create({
        id: 'TESTSESSION-3',
        student: { id: studentId } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-03'),
        score: 0,
      });
      await testSessionRepo.save(testSession3);

      const response = await requestTestAgent
        .get('/parents/dashboard/overview')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const body = response.body.data;
      expect(body.totalStudents).toBe(2);
      expect(body.totalTestSessions).toBe(3);
      expect(body.completedTestSessions).toBe(2);
      expect(body.inProgressTestSessions).toBe(1);
      expect(body.averageScore).toBe(82.5); // (75 + 90) / 2
      expect(body.testSessions.length).toBe(3);

      // Check test session structure
      const session = body.testSessions[0]; // Most recent first
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('student');
      expect(session.student).toHaveProperty('id');
      expect(session.student).toHaveProperty('username');
      expect(session.student).toHaveProperty('fullName');
      expect(session).toHaveProperty('titleAtTaken');
      expect(session).toHaveProperty('startedAt');
      expect(session).toHaveProperty('isCompleted');
      expect(session).toHaveProperty('sttWordResults');
      expect(Array.isArray(session.sttWordResults)).toBe(true);
    });

    it('should only show test sessions for parent own children', async () => {
      // Parent 2 should only see their child's sessions
      const response = await requestTestAgent
        .get('/parents/dashboard/overview')
        .set('Authorization', `Bearer ${parent2Token}`)
        .expect(200);

      const body = response.body.data;
      expect(body.totalStudents).toBe(1);
      expect(body.totalTestSessions).toBe(0);
    });

    it('should reject if user is not a parent', async () => {
      const teacherSignIn = await requestTestAgent
        .post('/auth/teachers/login')
        .send({
          email: 'teacher1@gmail.com',
          password: 'teacher1password',
        });
      const teacherToken = teacherSignIn.body.data.token;

      await requestTestAgent
        .get('/parents/dashboard/overview')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should reject if token is missing', async () => {
      await requestTestAgent.get('/parents/dashboard/overview').expect(401);
    });

    it('should reject if token is invalid', async () => {
      await requestTestAgent
        .get('/parents/dashboard/overview')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /parents/dashboard/children', () => {
    it('should return list of children with statistics', async () => {
      const response = await requestTestAgent
        .get('/parents/dashboard/children')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const body = response.body.data;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(2);

      const child = body[0];
      expect(child).toHaveProperty('id');
      expect(child).toHaveProperty('username');
      expect(child).toHaveProperty('fullName');
      expect(child).toHaveProperty('teacher');
      expect(child.teacher).toHaveProperty('id');
      expect(child.teacher).toHaveProperty('username');
      expect(child.teacher).toHaveProperty('fullName');
      expect(child).toHaveProperty('totalTestSessions');
      expect(child).toHaveProperty('completedTestSessions');
      expect(child).toHaveProperty('inProgressTestSessions');
      expect(child).toHaveProperty('averageScore');
      expect(child).toHaveProperty('levelProgresses');
      expect(Array.isArray(child.levelProgresses)).toBe(true);
      expect(child).toHaveProperty('createdAt');
    });

    it('should include level progress information', async () => {
      const response = await requestTestAgent
        .get('/parents/dashboard/children')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const body = response.body.data;
      const child = body[0];

      // Level progresses should be an array (can be empty for new students)
      expect(Array.isArray(child.levelProgresses)).toBe(true);
      // If there are level progresses, check the structure
      if (child.levelProgresses.length > 0) {
        const levelProgress = child.levelProgresses[0];
        expect(levelProgress).toHaveProperty('levelId');
        expect(levelProgress).toHaveProperty('levelNo');
        expect(levelProgress).toHaveProperty('levelName');
        expect(levelProgress).toHaveProperty('levelFullName');
        expect(levelProgress).toHaveProperty('isUnlocked');
        expect(levelProgress).toHaveProperty('isCompleted');
        expect(levelProgress).toHaveProperty('isSkipped');
        expect(levelProgress).toHaveProperty('currentPoints');
        expect(levelProgress).toHaveProperty('maxPoints');
        expect(levelProgress).toHaveProperty('progress');
        expect(levelProgress).toHaveProperty('requiredPoints');
        expect(levelProgress).toHaveProperty('goldCount');
        expect(levelProgress).toHaveProperty('silverCount');
        expect(levelProgress).toHaveProperty('bronzeCount');
      }
    });

    it('should include teacher information for each child', async () => {
      const response = await requestTestAgent
        .get('/parents/dashboard/children')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const body = response.body.data;
      const child = body[0];

      expect(child.teacher).toBeDefined();
      expect(child.teacher).toHaveProperty('id');
      expect(child.teacher).toHaveProperty('username', 'teacher1');
      expect(child.teacher).toHaveProperty('fullName', 'Teacher One');
    });

    it('should calculate child test session statistics correctly', async () => {
      // Add test sessions for child
      const storyRepo = dataSource.getRepository(Story);
      const story = await storyRepo.findOne({ where: {} });
      const testSessionRepo = dataSource.getRepository(TestSession);

      await testSessionRepo.save({
        id: 'TESTSESSION-1',
        student: { id: studentId } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-01'),
        finishedAt: new Date('2025-01-01'),
        score: 70,
        medal: StoryMedal.SILVER,
      });

      await testSessionRepo.save({
        id: 'TESTSESSION-2',
        student: { id: studentId } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-02'),
        finishedAt: new Date('2025-01-02'),
        score: 80,
        medal: StoryMedal.GOLD,
      });

      await testSessionRepo.save({
        id: 'TESTSESSION-3',
        student: { id: studentId } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-03'),
        score: 0,
      });

      const response = await requestTestAgent
        .get('/parents/dashboard/children')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const body: Array<{
        id: string;
        totalTestSessions: number;
        completedTestSessions: number;
        inProgressTestSessions: number;
        averageScore: number;
        lastTestSessionAt?: Date;
      }> = response.body.data;
      const child = body.find((c) => c.id === studentId);

      expect(child?.totalTestSessions).toBe(3);
      expect(child?.completedTestSessions).toBe(2);
      expect(child?.inProgressTestSessions).toBe(1);
      expect(child?.averageScore).toBe(75); // (70 + 80) / 2
      expect(child?.lastTestSessionAt).toBeDefined();
    });

    it('should only show children belonging to the parent', async () => {
      const response = await requestTestAgent
        .get('/parents/dashboard/children')
        .set('Authorization', `Bearer ${parent2Token}`)
        .expect(200);

      const body = response.body.data;
      expect(body.length).toBe(1);
      expect(body[0].username).toBe('student3');
    });

    it('should reject if user is not a parent', async () => {
      const studentSignIn = await requestTestAgent
        .post('/auth/students/login')
        .send({
          username: 'student1',
          password: '123456',
        });
      const studentToken = studentSignIn.body.data.token;

      await requestTestAgent
        .get('/parents/dashboard/children')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject if token is missing', async () => {
      await requestTestAgent.get('/parents/dashboard/children').expect(401);
    });
  });

  describe('GET /parents/dashboard/children/:studentId/test-sessions', () => {
    it('should return all test sessions for a specific child', async () => {
      // Create test sessions
      const storyRepo = dataSource.getRepository(Story);
      const story = await storyRepo.findOne({ where: {} });
      const testSessionRepo = dataSource.getRepository(TestSession);
      const sttWordResultRepo = dataSource.getRepository(STTWordResult);

      const testSession = testSessionRepo.create({
        id: 'TESTSESSION-1',
        student: { id: studentId } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-01'),
        finishedAt: new Date('2025-01-01'),
        score: 85,
        medal: StoryMedal.GOLD,
      });
      await testSessionRepo.save(testSession);

      await sttWordResultRepo.save({
        id: 'STT-1',
        testSession: testSession,
        expectedWord: 'hello',
        spokenWord: 'hello',
        accuracy: 100,
      });

      await sttWordResultRepo.save({
        id: 'STT-2',
        testSession: testSession,
        expectedWord: 'world',
        spokenWord: 'wrld',
        accuracy: 85,
      });

      const response = await requestTestAgent
        .get(`/parents/dashboard/children/${studentId}/test-sessions`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const body = response.body.data;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);

      const session = body[0];
      expect(session).toHaveProperty('id', 'TESTSESSION-1');
      expect(session).toHaveProperty('student');
      expect(session.student.id).toBe(studentId);
      expect(session).toHaveProperty('titleAtTaken');
      expect(session).toHaveProperty('score', 85);
      expect(session).toHaveProperty('medal', StoryMedal.GOLD);
      expect(session).toHaveProperty('isCompleted', true);
      expect(session).toHaveProperty('sttWordResults');
      expect(session.sttWordResults.length).toBe(2);

      const sttResult = session.sttWordResults[0];
      expect(sttResult).toHaveProperty('id');
      expect(sttResult).toHaveProperty('expectedWord');
      expect(sttResult).toHaveProperty('spokenWord');
      expect(sttResult).toHaveProperty('accuracy');
    });

    it('should return 404 if child does not belong to parent', async () => {
      // Try to access another parent's child
      const parent2Children = await requestTestAgent
        .get('/parents/dashboard/children')
        .set('Authorization', `Bearer ${parent2Token}`)
        .expect(200);

      const parent2ChildId = parent2Children.body.data[0].id;

      await requestTestAgent
        .get(`/parents/dashboard/children/${parent2ChildId}/test-sessions`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);
    });

    it('should return 404 if child does not exist', async () => {
      await requestTestAgent
        .get('/parents/dashboard/children/NON_EXISTENT_ID/test-sessions')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);
    });

    it('should return empty array if child has no test sessions', async () => {
      const response = await requestTestAgent
        .get(`/parents/dashboard/children/${studentId}/test-sessions`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should reject if user is not a parent', async () => {
      const teacherSignIn = await requestTestAgent
        .post('/auth/teachers/login')
        .send({
          email: 'teacher1@gmail.com',
          password: 'teacher1password',
        });
      const teacherToken = teacherSignIn.body.data.token;

      await requestTestAgent
        .get(`/parents/dashboard/children/${studentId}/test-sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should reject if token is missing', async () => {
      await requestTestAgent
        .get(`/parents/dashboard/children/${studentId}/test-sessions`)
        .expect(401);
    });
  });

  describe('GET /parents/dashboard/children/:studentId/test-sessions/:testSessionId', () => {
    it('should return specific test session details', async () => {
      const storyRepo = dataSource.getRepository(Story);
      const story = await storyRepo.findOne({ where: {} });
      const testSessionRepo = dataSource.getRepository(TestSession);
      const sttWordResultRepo = dataSource.getRepository(STTWordResult);

      const testSession = testSessionRepo.create({
        id: 'TESTSESSION-1',
        student: { id: studentId } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-01'),
        finishedAt: new Date('2025-01-01'),
        score: 92,
        medal: StoryMedal.GOLD,
      });
      await testSessionRepo.save(testSession);

      await sttWordResultRepo.save({
        id: 'STT-1',
        testSession: testSession,
        expectedWord: 'apple',
        spokenWord: 'apple',
        accuracy: 100,
        instruction: 'Say the word "apple"',
      });

      await sttWordResultRepo.save({
        id: 'STT-2',
        testSession: testSession,
        expectedWord: 'banana',
        spokenWord: 'banana',
        accuracy: 95,
      });

      const response = await requestTestAgent
        .get(
          `/parents/dashboard/children/${studentId}/test-sessions/TESTSESSION-1`,
        )
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      const body = response.body.data;
      expect(body).toHaveProperty('id', 'TESTSESSION-1');
      expect(body).toHaveProperty('student');
      expect(body.student.id).toBe(studentId);
      expect(body).toHaveProperty('score', 92);
      expect(body).toHaveProperty('medal', StoryMedal.GOLD);
      expect(body.sttWordResults.length).toBe(2);

      const sttResult1 = body.sttWordResults[0];
      expect(sttResult1).toHaveProperty('id', 'STT-1');
      expect(sttResult1).toHaveProperty('expectedWord', 'apple');
      expect(sttResult1).toHaveProperty('spokenWord', 'apple');
      expect(sttResult1).toHaveProperty('accuracy', 100);
      expect(sttResult1).toHaveProperty('instruction', 'Say the word "apple"');
    });

    it('should return 404 if test session does not exist', async () => {
      await requestTestAgent
        .get(
          `/parents/dashboard/children/${studentId}/test-sessions/NON_EXISTENT`,
        )
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);
    });

    it('should return 404 if child does not belong to parent', async () => {
      const parent2Children = await requestTestAgent
        .get('/parents/dashboard/children')
        .set('Authorization', `Bearer ${parent2Token}`)
        .expect(200);
      const parent2ChildId = parent2Children.body.data[0].id;

      await requestTestAgent
        .get(
          `/parents/dashboard/children/${parent2ChildId}/test-sessions/TESTSESSION-1`,
        )
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);
    });

    it('should return 404 if student does not exist', async () => {
      await requestTestAgent
        .get(
          '/parents/dashboard/children/NON_EXISTENT/test-sessions/TESTSESSION-1',
        )
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);
    });

    it('should reject if token is missing', async () => {
      await requestTestAgent
        .get(
          `/parents/dashboard/children/${studentId}/test-sessions/TESTSESSION-1`,
        )
        .expect(401);
    });

    it('should reject if user is not a parent', async () => {
      const studentSignIn = await requestTestAgent
        .post('/auth/students/login')
        .send({
          username: 'student1',
          password: '123456',
        });
      const studentToken = studentSignIn.body.data.token;

      await requestTestAgent
        .get(
          `/parents/dashboard/children/${studentId}/test-sessions/TESTSESSION-1`,
        )
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
