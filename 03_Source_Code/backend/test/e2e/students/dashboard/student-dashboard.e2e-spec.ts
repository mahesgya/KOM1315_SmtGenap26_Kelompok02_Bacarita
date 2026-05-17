/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { MailService } from 'src/common/mail/mail.service';
import { TokenGeneratorService } from 'src/common/token-generator/token-generator.service';
import { LevelSeeder } from 'src/database/seeders/level.seeder';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import createTestingApp from '../../../utils/create-testing-app.utils';
import { clearDatabase } from '../../../utils/testing-database.utils';

describe('Student Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let requestTestAgent: TestAgent;
  let tokenGeneratorService: TokenGeneratorService;
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

    randomUUIDV7.mockReset();
    randomNumericCode.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // none
  });

  it('GET /students/levels | must return student levels and its correct data', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;
    expect(body).toBeDefined();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(6);
    expect(body[0].stories.length).toBe(1);
    expect(body[1].stories.length).toBe(5);
    expect(body[2].stories.length).toBe(2);

    const level0 = body[0];
    const level1 = body[1];
    expect(level0.no).toBe(0);
    expect(level0.name).toBe('Pre-Test: Tes Kemampuan Awal');
    expect(level0.fullName).toBe('Level 0. Pre-Test: Tes Kemampuan Awal');
    expect(level0.isBonusLevel).toBe(false);
    expect(level0.maxPoints).toBe(3);
    expect(level0.isCompleted).toBe(false);
    expect(level0.isSkipped).toBe(false);
    expect(level0.isUnlocked).toBe(true);
    expect(level0.goldCount).toBe(0);
    expect(level0.silverCount).toBe(0);
    expect(level0.bronzeCount).toBe(0);
    expect(level0.progress).toBe(0);

    const story1_level0 = level0.stories[0];
    expect(story1_level0).toBeDefined();
    expect(story1_level0.title).toBe('Tes Kemampuan Membaca');
    expect(story1_level0.imageUrl).toBe(
      `${process.env.APP_URL}/public/placeholder.webp`,
    );
    expect(story1_level0.isGoldMedal).toBe(false);
    expect(story1_level0.isSilverMedal).toBe(false);
    expect(story1_level0.isBronzeMedal).toBe(false);
    const story1_level1 = level1.stories[0];
    expect(story1_level1).toBeDefined();
    expect(story1_level1.imageUrl).toBeNull();
    expect(story1_level1.isGoldMedal).toBe(false);
    expect(story1_level1.isSilverMedal).toBe(false);
    expect(story1_level1.isBronzeMedal).toBe(false);
  });

  it('GET /students/levels/:id | must return student level and its correct data', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    const levelIdResponse = await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const levelId = levelIdResponse.body.data[1].id;

    const response = await requestTestAgent
      .get(`/students/levels/${levelId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;

    const level = body;
    expect(level.no).toBe(1);
    expect(level.name).toBe('Dasar Vokal dan Konsonan');
    expect(level.fullName).toBe('Level 1. Dasar Vokal dan Konsonan');
    expect(level.isBonusLevel).toBe(false);
    expect(level.maxPoints).toBe(15);
    expect(level.isUnlocked).toBe(true);
    expect(level.isSkipped).toBe(false);
    expect(level.isCompleted).toBe(false);
    expect(level.requiredPoints).toBe(12);
    expect(level.goldCount).toBe(0);
    expect(level.silverCount).toBe(0);
    expect(level.bronzeCount).toBe(0);
    expect(level.progress).toBe(0);

    const story1_level = level.stories[0];
    expect(story1_level).toBeDefined();
    expect(story1_level.title).toBe('Bacaan 1: Dasar Vokal dan Konsonan');
    expect(story1_level.imageUrl).toBeNull();
    expect(story1_level.isGoldMedal).toBe(false);
    expect(story1_level.isSilverMedal).toBe(false);
    expect(story1_level.isBronzeMedal).toBe(false);
    const story2_level = level.stories[1];
    expect(story2_level).toBeDefined();
    expect(story2_level.title).toBe('Bacaan 2: Bentuk Huruf');
    expect(story2_level.imageUrl).toBe(
      `${process.env.APP_URL}/public/placeholder.webp`,
    );
    expect(story2_level.isGoldMedal).toBe(false);
    expect(story2_level.isSilverMedal).toBe(false);
    expect(story2_level.isBronzeMedal).toBe(false);
  });

  it('GET /students/levels/:id | must return 404 if level not found', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    await requestTestAgent
      .get(`/students/levels/999999`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('GET /students/levels | must reject if user is not a student', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('GET /students/levels | must reject if token is invalid', async () => {
    await requestTestAgent
      .get('/students/levels')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('GET /students/levels | must reject if token is missing', async () => {
    await requestTestAgent.get('/students/levels').expect(401);
  });
});
