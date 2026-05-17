/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { App } from 'supertest/types';
import createTestingApp from '../../utils/create-testing-app.utils';
import { clearDatabase } from '../../utils/testing-database.utils';
import { MailService } from 'src/common/mail/mail.service';
import { TokenGeneratorService } from 'src/common/token-generator/token-generator.service';

describe('Auth Me (e2e)', () => {
  let app: INestApplication<App>;
  let requestTestAgent: TestAgent;

  let tokenGeneratorService: TokenGeneratorService;
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
    randomNumericCode = jest.spyOn(tokenGeneratorService, 'numericCode');

    // Create a test teacher and student
    randomNumericCode.mockReturnValue('123456');
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

    randomNumericCode.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // none
  });

  it('GET /auth/me | must return teacher profile', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);

    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', 'teacher1@gmail.com');
    expect(body).toHaveProperty('username', 'teacher1');
    expect(body).toHaveProperty('fullName', 'Teacher One');
    expect(body).toHaveProperty('schoolName', 'School Name 1');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
  });

  it('GET /auth/me | must return student profile', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: '123456',
      })
      .expect(200);

    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('username', 'student1');
    expect(body).toHaveProperty('fullName', 'Student One');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
  });

  it('GET /auth/me | must return parent profile', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/parents/login')
      .send({
        email: 'parent1@gmail.com',
        password: '123456',
      })
      .expect(200);

    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', 'parent1@gmail.com');
    expect(body).toHaveProperty('username', 'parent1');
    expect(body).toHaveProperty('fullName', 'Parent One');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
  });

  it('GET /auth/me | must reject if token is missing', async () => {
    await requestTestAgent.get('/auth/me').expect(401);
  });

  it('GET /auth/me | must reject if token is invalid', async () => {
    await requestTestAgent
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
