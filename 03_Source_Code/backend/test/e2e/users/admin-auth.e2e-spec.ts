/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Admin } from 'src/feature/users/entities/admin.entity';
import { Parent } from 'src/feature/users/entities/parent.entity';
import { Student } from 'src/feature/users/entities/student.entity';
import { Teacher } from 'src/feature/users/entities/teacher.entity';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import createTestingApp from '../../utils/create-testing-app.utils';
import { clearDatabase } from '../../utils/testing-database.utils';

describe('Admin Auth (e2e)', () => {
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
    // Create a test admin for login tests
    const hashedPassword = await bcrypt.hash('adminbacarita123', 10);
    await dataSource.getRepository(Admin).save({
      id: uuidv4(),
      email: 'admin@bacarita.com',
      username: 'admin',
      password: hashedPassword,
      fullName: 'Admin Bacarita',
      token: null,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // none
  });

  it('POST /auth/admins/login | must sign in with email if credentials are valid', async () => {
    const response = await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'admin@bacarita.com',
        password: 'adminbacarita123',
      })
      .expect(200);

    const body = response.body.data;

    expect(body).not.toHaveProperty('id');
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('username');
    expect(body).not.toHaveProperty('fullName');
    expect(body).not.toHaveProperty('password');
    expect(body).toHaveProperty('token');

    // Verify token is saved in database
    const adminInDb: Admin | null = await dataSource
      .getRepository(Admin)
      .findOneBy({ email: 'admin@bacarita.com' });
    expect(adminInDb).toBeDefined();
    expect(adminInDb!.token).toBe(body.token);
  });

  it('POST /auth/admins/login | must sign in with username if credentials are valid', async () => {
    const response = await requestTestAgent
      .post('/auth/admins/login')
      .send({
        username: 'admin',
        password: 'adminbacarita123',
      })
      .expect(200);

    const body = response.body.data;
    expect(body).not.toHaveProperty('id');
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('username');
    expect(body).not.toHaveProperty('fullName');
    expect(body).not.toHaveProperty('password');
    expect(body).toHaveProperty('token');

    // Verify token is saved in database
    const adminInDb: Admin | null = await dataSource
      .getRepository(Admin)
      .findOneBy({ email: 'admin@bacarita.com' });
    expect(adminInDb).toBeDefined();
    expect(adminInDb!.token).toBe(body.token);
  });

  it('POST /auth/admins/login | must reject if email is invalid', async () => {
    await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'invalid@gmail.com',
        password: 'adminbacarita123',
      })
      .expect(401);
  });

  it('POST /auth/admins/login | must reject if username is invalid', async () => {
    await requestTestAgent
      .post('/auth/admins/login')
      .send({
        username: 'invaliduser',
        password: 'adminbacarita123',
      })
      .expect(401);
  });

  it('POST /auth/admins/login | must reject if password is wrong', async () => {
    await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'admin@bacarita.com',
        password: 'wrongpassword',
      })
      .expect(401);
  });

  it('POST /auth/admins/login | must reject if neither email nor username provided', async () => {
    await requestTestAgent
      .post('/auth/admins/login')
      .send({
        password: 'adminbacarita123',
      })
      .expect(401);
  });

  it('POST /auth/admins/login | must reject if password is missing', async () => {
    await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'admin@bacarita.com',
      })
      .expect(400);
  });

  it('POST /auth/admins/login | must reject if request body is empty', async () => {
    await requestTestAgent.post('/auth/admins/login').send({}).expect(400);
  });

  it('POST /auth/admins/login | must reject if email format is invalid', async () => {
    await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'invalid-email',
        password: 'adminbacarita123',
      })
      .expect(400);
  });

  it('POST /auth/admins/login | must reject if both username and email are provided', async () => {
    await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'admin@bacarita.com',
        username: 'admin',
        password: 'adminbacarita123',
      })
      .expect(403);
  });

  it('POST /auth/admins/logout | must sign out successfully', async () => {
    // First sign in
    const signInResponse = await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'admin@bacarita.com',
        password: 'adminbacarita123',
      })
      .expect(200);

    const token = signInResponse.body.data.token;

    // Then sign out
    await requestTestAgent
      .post('/auth/admins/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify token is cleared from database
    const adminInDb: Admin | null = await dataSource
      .getRepository(Admin)
      .findOneBy({ email: 'admin@bacarita.com' });
    expect(adminInDb).toBeDefined();
    expect(adminInDb!.token).toBeNull();
  });

  it('POST /auth/admins/logout | must reject if token is invalid', async () => {
    await requestTestAgent
      .post('/auth/admins/logout')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('POST /auth/admins/logout | must reject if token is missing', async () => {
    await requestTestAgent.post('/auth/admins/logout').expect(401);
  });

  it('POST /auth/admins/logout | must reject token if already logged out', async () => {
    // First sign in
    const signInResponse = await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'admin@bacarita.com',
        password: 'adminbacarita123',
      })
      .expect(200);

    const token = signInResponse.body.data.token;

    // Sign out once
    await requestTestAgent
      .post('/auth/admins/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Try to sign out again with the same token
    await requestTestAgent
      .post('/auth/admins/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('GET /auth/me | must return admin profile', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/admins/login')
      .send({
        email: 'admin@bacarita.com',
        password: 'adminbacarita123',
      })
      .expect(200);

    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', 'admin@bacarita.com');
    expect(body).toHaveProperty('username', 'admin');
    expect(body).toHaveProperty('fullName', 'Admin Bacarita');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
  });

  it('POST /auth/admins/logout | must reject if user is not an admin', async () => {
    // test other role token (teacher)
    const hashedTeacherPassword = await bcrypt.hash('teacher1password', 10);
    await dataSource.getRepository(Teacher).save({
      id: '001',
      email: 'teacher1@gmail.com',
      username: 'teacher1',
      password: hashedTeacherPassword,
      fullName: 'Teacher One',
      schoolName: 'School Name 1',
    });

    await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200)
      .then(async (res) => {
        const token = res.body.data.token;
        // Attempt to logout as admin
        await requestTestAgent
          .post('/auth/admins/logout')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });

    // test other role token (student)
    await dataSource.getRepository(Student).save({
      id: '002',
      username: 'student1',
      password: await bcrypt.hash('student1password', 10),
      fullName: 'Student One',
    });

    await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: 'student1password',
      })
      .expect(200)
      .then(async (res) => {
        const token = res.body.data.token;
        // Attempt to logout as admin
        await requestTestAgent
          .post('/auth/admins/logout')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });

    // test other role token (parent)
    await dataSource.getRepository(Parent).save({
      id: '003',
      email: 'parent1@mail.com',
      username: 'parent1',
      password: await bcrypt.hash('parent1password', 10),
      fullName: 'Parent One',
    });

    await requestTestAgent
      .post('/auth/parents/login')
      .send({
        email: 'parent1@mail.com',
        password: 'parent1password',
      })
      .expect(200)
      .then(async (res) => {
        const token = res.body.data.token;

        // Attempt to logout as admin
        await requestTestAgent
          .post('/auth/admins/logout')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });
  });
});
