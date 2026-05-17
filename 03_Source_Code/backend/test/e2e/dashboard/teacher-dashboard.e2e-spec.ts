/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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

describe('Teacher Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let requestTestAgent: TestAgent;
  let dataSource: DataSource;
  let teacherToken: string;
  let teacher2Token: string;
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

    // Create teacher 1
    await requestTestAgent.post('/teachers').send({
      email: 'teacher1@gmail.com',
      username: 'teacher1',
      password: 'teacher1password',
      confirmPassword: 'teacher1password',
      fullName: 'Teacher One',
      schoolName: 'School Name 1',
    });

    const teacher1SignIn = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      });
    teacherToken = teacher1SignIn.body.data.token;

    // Seed levels
    const levelSeeder: LevelSeeder = new LevelSeeder(dataSource);
    await levelSeeder.run();

    // Create students for teacher 1
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

    // Create teacher 2 with different students
    randomUUIDV7.mockReturnValue('2');
    randomNumericCode.mockReturnValue('345678');
    await requestTestAgent.post('/teachers').send({
      email: 'teacher2@gmail.com',
      username: 'teacher2',
      password: 'teacher2password',
      confirmPassword: 'teacher2password',
      fullName: 'Teacher Two',
      schoolName: 'School Name 2',
    });

    const teacher2SignIn = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher2@gmail.com',
        password: 'teacher2password',
      });
    teacher2Token = teacher2SignIn.body.data.token;

    randomUUIDV7.mockReturnValue('STUDENT3');
    randomNumericCode.mockReturnValue('456789');
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student3',
        studentFullName: 'Student Three',
        parentEmail: 'parent3@gmail.com',
        parentFullName: 'Parent Three',
      })
      .set('Authorization', `Bearer ${teacher2Token}`);

    randomUUIDV7.mockReset();
    randomNumericCode.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /teachers/dashboard/overview', () => {
    it('should return dashboard overview with statistics', async () => {
      const response = await requestTestAgent
        .get('/teachers/dashboard/overview')
        .set('Authorization', `Bearer ${teacherToken}`)
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

      // Completed test session for student 1
      const testSession1 = testSessionRepo.create({
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

      // In-progress test session for student 2
      const testSession2 = testSessionRepo.create({
        id: 'TESTSESSION-2',
        student: { id: student2Id } as Student,
        story: story || undefined,
        titleAtTaken: story!.title,
        passageAtTaken: story!.passage,
        descriptionAtTaken: story!.description,
        startedAt: new Date('2025-01-02'),
        score: 0,
      });
      await testSessionRepo.save(testSession2);

      const response = await requestTestAgent
        .get('/teachers/dashboard/overview')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const body = response.body.data;
      expect(body.totalStudents).toBe(2);
      expect(body.totalTestSessions).toBe(2);
      expect(body.completedTestSessions).toBe(1);
      expect(body.inProgressTestSessions).toBe(1);
      expect(body.averageScore).toBe(85);
      expect(body.testSessions.length).toBe(2);

      // Check test session structure
      const session = body.testSessions[1]; // Most recent first
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

    it('should only show test sessions for teacher own students', async () => {
      // Teacher 2 should only see their student's sessions
      const response = await requestTestAgent
        .get('/teachers/dashboard/overview')
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(200);

      const body = response.body.data;
      expect(body.totalStudents).toBe(1);
      expect(body.totalTestSessions).toBe(0);
    });

    it('should reject if user is not a teacher', async () => {
      const studentSignIn = await requestTestAgent
        .post('/auth/students/login')
        .send({
          username: 'student1',
          password: '123456',
        });
      const studentToken = studentSignIn.body.data.token;

      await requestTestAgent
        .get('/teachers/dashboard/overview')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject if token is missing', async () => {
      await requestTestAgent.get('/teachers/dashboard/overview').expect(401);
    });

    it('should reject if token is invalid', async () => {
      await requestTestAgent
        .get('/teachers/dashboard/overview')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /teachers/dashboard/students', () => {
    it('should return list of students with statistics', async () => {
      const response = await requestTestAgent
        .get('/teachers/dashboard/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const body = response.body.data;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(2);

      const student = body[0];
      expect(student).toHaveProperty('id');
      expect(student).toHaveProperty('username');
      expect(student).toHaveProperty('fullName');
      expect(student).toHaveProperty('parent');
      expect(student.parent).toHaveProperty('id');
      expect(student.parent).toHaveProperty('email');
      expect(student.parent).toHaveProperty('username');
      expect(student.parent).toHaveProperty('fullName');
      expect(student).toHaveProperty('totalTestSessions');
      expect(student).toHaveProperty('completedTestSessions');
      expect(student).toHaveProperty('inProgressTestSessions');
      expect(student).toHaveProperty('averageScore');
      expect(student).toHaveProperty('levelProgresses');
      expect(Array.isArray(student.levelProgresses)).toBe(true);
      expect(student).toHaveProperty('createdAt');
    });

    it('should include level progress information', async () => {
      const response = await requestTestAgent
        .get('/teachers/dashboard/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const body = response.body.data;
      const student = body[0];

      // Level progresses should be an array (can be empty for new students)
      expect(Array.isArray(student.levelProgresses)).toBe(true);
      // If there are level progresses, check the structure
      if (student.levelProgresses.length > 0) {
        const levelProgress = student.levelProgresses[0];
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

    it('should calculate student test session statistics correctly', async () => {
      // Add test sessions for student
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
        score: 80,
        medal: StoryMedal.GOLD,
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
        score: 90,
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
        .get('/teachers/dashboard/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const body = response.body.data;
      const student = body.find((s: any) => s.id === studentId);

      expect(student.totalTestSessions).toBe(3);
      expect(student.completedTestSessions).toBe(2);
      expect(student.inProgressTestSessions).toBe(1);
      expect(student.averageScore).toBe(85); // (80 + 90) / 2
      expect(student.lastTestSessionAt).toBeDefined();
    });

    it('should only show students belonging to the teacher', async () => {
      const response = await requestTestAgent
        .get('/teachers/dashboard/students')
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(200);

      const body = response.body.data;
      expect(body.length).toBe(1);
      expect(body[0].username).toBe('student3');
    });

    it('should return empty array if teacher has no students', async () => {
      // Create new teacher with no students
      const randomUUIDV7 = jest.spyOn(tokenGeneratorService, 'randomUUIDV7');
      randomUUIDV7.mockReturnValue('TEACHER3');

      await requestTestAgent.post('/teachers').send({
        email: 'teacher3@gmail.com',
        username: 'teacher3',
        password: 'teacher3password',
        confirmPassword: 'teacher3password',
        fullName: 'Teacher Three',
        schoolName: 'School Name 3',
      });

      randomUUIDV7.mockReset();

      const teacher3SignIn = await requestTestAgent
        .post('/auth/teachers/login')
        .send({
          email: 'teacher3@gmail.com',
          password: 'teacher3password',
        });
      const teacher3Token = teacher3SignIn.body.data.token;

      const response = await requestTestAgent
        .get('/teachers/dashboard/students')
        .set('Authorization', `Bearer ${teacher3Token}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should reject if user is not a teacher', async () => {
      const parentSignIn = await requestTestAgent
        .post('/auth/parents/login')
        .send({
          email: 'parent1@gmail.com',
          password: '123456',
        });
      const parentToken = parentSignIn.body.data.token;

      await requestTestAgent
        .get('/teachers/dashboard/students')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);
    });

    it('should reject if token is missing', async () => {
      await requestTestAgent.get('/teachers/dashboard/students').expect(401);
    });
  });

  describe('GET /teachers/dashboard/students/:studentId/test-sessions', () => {
    it('should return all test sessions for a specific student', async () => {
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
        spokenWord: 'world',
        accuracy: 95,
      });

      const response = await requestTestAgent
        .get(`/teachers/dashboard/students/${studentId}/test-sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
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

    it('should return 404 if student does not belong to teacher', async () => {
      // Try to access another teacher's student
      const teacher2Students = await requestTestAgent
        .get('/teachers/dashboard/students')
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(200);

      const teacher2StudentId = teacher2Students.body.data[0].id;

      await requestTestAgent
        .get(`/teachers/dashboard/students/${teacher2StudentId}/test-sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should return 404 if student does not exist', async () => {
      await requestTestAgent
        .get('/teachers/dashboard/students/NON_EXISTENT_ID/test-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should return empty array if student has no test sessions', async () => {
      const response = await requestTestAgent
        .get(`/teachers/dashboard/students/${studentId}/test-sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should reject if user is not a teacher', async () => {
      const studentSignIn = await requestTestAgent
        .post('/auth/students/login')
        .send({
          username: 'student1',
          password: '123456',
        });
      const studentToken = studentSignIn.body.data.token;

      await requestTestAgent
        .get(`/teachers/dashboard/students/${studentId}/test-sessions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject if token is missing', async () => {
      await requestTestAgent
        .get(`/teachers/dashboard/students/${studentId}/test-sessions`)
        .expect(401);
    });
  });

  describe('GET /teachers/dashboard/students/:studentId/test-sessions/:testSessionId', () => {
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

      const response = await requestTestAgent
        .get(
          `/teachers/dashboard/students/${studentId}/test-sessions/TESTSESSION-1`,
        )
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const body = response.body.data;
      expect(body).toHaveProperty('id', 'TESTSESSION-1');
      expect(body).toHaveProperty('student');
      expect(body.student.id).toBe(studentId);
      expect(body).toHaveProperty('score', 85);
      expect(body).toHaveProperty('medal', StoryMedal.GOLD);
      expect(body.sttWordResults.length).toBe(1);
    });

    it('should return 404 if test session does not exist', async () => {
      await requestTestAgent
        .get(
          `/teachers/dashboard/students/${studentId}/test-sessions/NON_EXISTENT`,
        )
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should return 404 if student does not belong to teacher', async () => {
      const teacher2Students = await requestTestAgent
        .get('/teachers/dashboard/students')
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(200);
      const teacher2StudentId = teacher2Students.body.data[0].id;

      await requestTestAgent
        .get(
          `/teachers/dashboard/students/${teacher2StudentId}/test-sessions/TESTSESSION-1`,
        )
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should reject if token is missing', async () => {
      await requestTestAgent
        .get(
          `/teachers/dashboard/students/${studentId}/test-sessions/TESTSESSION-1`,
        )
        .expect(401);
    });
  });
});
