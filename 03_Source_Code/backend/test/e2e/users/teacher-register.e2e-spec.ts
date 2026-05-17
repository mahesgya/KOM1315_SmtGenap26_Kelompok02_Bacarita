/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { Teacher } from 'src/feature/users/entities/teacher.entity';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import createTestingApp from '../../utils/create-testing-app.utils';
import { clearDatabase } from '../../utils/testing-database.utils';

describe('Teachers Register (e2e)', () => {
  let app: INestApplication<App>;
  let requestTestAgent: TestAgent;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestingApp();
    requestTestAgent = request(app.getHttpServer());
    dataSource = app.get<DataSource>(DataSource);
  }, 15000);

  beforeEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // none
  });

  it('POST /teachers | must register if request body is valid', async () => {
    const response = await requestTestAgent
      .post('/teachers')
      .send({
        email: 'teacher1@gmail.com',
        username: 'teacher1',
        password: 'teacher1password',
        confirmPassword: 'teacher1password',
        fullName: 'Teacher One',
        schoolName: 'School Name 1',
      })
      .expect(201);
    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', 'teacher1@gmail.com');
    expect(body).toHaveProperty('username', 'teacher1');
    expect(body).toHaveProperty('fullName', 'Teacher One');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
    expect(body).toHaveProperty('schoolName', 'School Name 1');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');

    const teacherInDb: Teacher | null = await dataSource
      .getRepository(Teacher)
      .findOneBy({ id: body.id });
    expect(teacherInDb).toBeDefined();
    expect(teacherInDb).toHaveProperty('email', 'teacher1@gmail.com');
    expect(teacherInDb).toHaveProperty('username', 'teacher1');
    expect(teacherInDb).toHaveProperty('fullName', 'Teacher One');
    expect(teacherInDb!.password).not.toBe('teacher1password'); // must be hashed
    expect(teacherInDb).toHaveProperty('schoolName', 'School Name 1');
    expect(teacherInDb).toHaveProperty('createdAt');
    expect(teacherInDb).toHaveProperty('updatedAt');
  });

  it('POST /teachers | must reject if email already registered', async () => {
    const response = await requestTestAgent.post('/teachers').send({
      email: 'teacher1@gmail.com',
      username: 'teacher1',
      password: 'teacher1password',
      confirmPassword: 'teacher1password',
      fullName: 'Teacher One',
      schoolName: 'School Name 1',
    });
    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', 'teacher1@gmail.com');
    expect(body).toHaveProperty('username', 'teacher1');
    expect(body).toHaveProperty('fullName', 'Teacher One');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
    expect(body).toHaveProperty('schoolName', 'School Name 1');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');

    // Try to register again with same email
    await requestTestAgent
      .post('/teachers')
      .send({
        email: 'teacher1@gmail.com',
        username: 'teacher1zzz',
        password: 'teacher1passwordzzz',
        confirmPassword: 'teacher1passwordzzz',
        fullName: 'Teacher One zzz',
        schoolName: 'School Name 1',
      })
      .expect(400);

    // Try to register again with same email but different case
    await requestTestAgent
      .post('/teachers')
      .send({
        email: 'TEACHER1@gmail.com',
        username: 'teacher1zzz',
        password: 'teacher1passwordzzz',
        confirmPassword: 'teacher1passwordzzz',
        fullName: 'Teacher One zzz',
        schoolName: 'School Name 1',
      })
      .expect(400);
  });

  it('POST /teachers | must reject if username already registered (test case-sensitivy too)', async () => {
    const response = await requestTestAgent.post('/teachers').send({
      email: 'teacher1@gmail.com',
      username: 'teacher1',
      password: 'teacher1password',
      confirmPassword: 'teacher1password',
      fullName: 'Teacher One',
      schoolName: 'School Name 1',
    });
    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', 'teacher1@gmail.com');
    expect(body).toHaveProperty('username', 'teacher1');
    expect(body).toHaveProperty('fullName', 'Teacher One');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
    expect(body).toHaveProperty('schoolName', 'School Name 1');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');

    // Try to register again with same email
    await requestTestAgent
      .post('/teachers')
      .send({
        email: 'teacher2@gmail.com',
        username: 'teacher1',
        password: 'teacher1passwordzzz',
        confirmPassword: 'teacher1passwordzzz',
        fullName: 'Teacher One zzz',
        schoolName: 'School Name 1',
      })
      .expect(400);

    // Try to register again with different case username
    await requestTestAgent
      .post('/teachers')
      .send({
        email: 'teacher2@gmail.com',
        username: 'TEACHer1',
        password: 'teacher1passwordzzz',
        confirmPassword: 'teacher1passwordzzz',
        fullName: 'Teacher One zzz',
        schoolName: 'School Name 1',
      })
      .expect(400);
  });

  it('POST /teachers | must reject if username have a space ( )', async () => {
    await requestTestAgent
      .post('/teachers')
      .send({
        email: 'teacher1@gmail.com',
        username: 'teacher 1 spaces',
        password: 'teacher1password',
        confirmPassword: 'teacher1password_mismatch',
        fullName: 'Teacher One',
        schoolName: 'School Name 1',
      })
      .expect(400);
  });

  it('POST /teachers | must reject if confirmPassword is not same as password (test case-sensitivy too)', async () => {
    await requestTestAgent
      .post('/teachers')
      .send({
        email: 'teacher1@gmail.com',
        username: 'teacher1',
        password: 'teacher1password',
        confirmPassword: 'teacher1password_mismatch',
        fullName: 'Teacher One',
        schoolName: 'School Name 1',
      })
      .expect(400);
  });

  it('POST /teachers | must reject if request body is not valid', async () => {
    await requestTestAgent
      .post('/teachers')
      .send({
        email: 'teacher1com',
        username: '',
        password: '',
        confirmPassword: 'teacher1password_mismatch',
        fullName: '<SCRIPT>Teacher One<>',
        schoolName: 'School Name 1',
      })
      .expect(400);
  });

  it('POST /teachers | must reject if request body is empty', async () => {
    return requestTestAgent
      .post('/teachers')
      .send({
        email: '',
        username: '',
        password: '',
        fullName: '',
        schoolName: '',
      })
      .expect(400);
  });

  it('POST /teachers | must reject if fields is missing', async () => {
    return requestTestAgent.post('/teachers').send({}).expect(400);
  });
});
