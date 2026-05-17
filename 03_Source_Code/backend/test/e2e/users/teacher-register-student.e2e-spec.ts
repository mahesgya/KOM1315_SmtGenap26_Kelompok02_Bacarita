/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { TokenGeneratorService } from 'src/common/token-generator/token-generator.service';
import { AccountManagementService } from 'src/feature/account-management/account-management.service';
import { Parent } from 'src/feature/users/entities/parent.entity';
import { Student } from 'src/feature/users/entities/student.entity';
import { Teacher } from 'src/feature/users/entities/teacher.entity';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import createTestingApp from '../../utils/create-testing-app.utils';
import { clearDatabase } from '../../utils/testing-database.utils';
import { MailService } from 'src/common/mail/mail.service';
import * as bcrypt from 'bcrypt';
import { LevelSeeder } from 'src/database/seeders/level.seeder';
import { LevelProgress } from 'src/feature/levels/entities/level-progress.entity';

describe('Teacher Register a Student and its Parent (e2e)', () => {
  let app: INestApplication<App>;
  let requestTestAgent: TestAgent;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestingApp();
    requestTestAgent = request(app.getHttpServer());
    dataSource = app.get<DataSource>(DataSource);
  }, 15000);

  beforeEach(async () => {
    const mailService = app.get(MailService);
    jest
      .spyOn(mailService, 'sendFirstTimeWelcomeParentWithStudentEmail')
      .mockResolvedValue(undefined);
    jest
      .spyOn(mailService, 'sendStudentAccountInfoToParentEmail')
      .mockResolvedValue(undefined);

    await clearDatabase(app);
    // Create a test teacher for login tests
    await requestTestAgent.post('/teachers').send({
      email: 'teacher1@gmail.com',
      username: 'teacher1',
      password: 'teacher1password',
      confirmPassword: 'teacher1password',
      fullName: 'Teacher One',
      schoolName: 'School Name 1',
    });

    // Create a test teacher 2 for login tests
    await requestTestAgent.post('/teachers').send({
      email: 'teacher2@gmail.com',
      username: 'teacher2',
      password: 'teacher2password',
      confirmPassword: 'teacher2password',
      fullName: 'Teacher Two',
      schoolName: 'School Name 2',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // none
  });

  it('AccountManagementService.createStudentWithParentAccount | [TRANSACTIONAL] must rollback if there are faulty database errors', async () => {
    const tokenGeneratorServiceService: TokenGeneratorService = app.get(
      TokenGeneratorService,
    );
    const randomUUIDV7Mock = jest.spyOn(
      tokenGeneratorServiceService,
      'randomUUIDV7',
    );

    const accMngService: AccountManagementService = app.get(
      AccountManagementService,
    );

    // Create a test teacher
    const responseRegisterTeacher = await requestTestAgent
      .post('/teachers')
      .send({
        email: 'teacher3@gmail.com',
        username: 'teacher3',
        password: 'teacher3password',
        confirmPassword: 'teacher3password',
        fullName: 'Teacher Three',
        schoolName: 'School Name 3',
      });
    const teacherId = responseRegisterTeacher.body.data.id;

    randomUUIDV7Mock.mockImplementationOnce(() => 'valid-uuid-v7'); // for parent
    randomUUIDV7Mock.mockImplementationOnce(() => null as never); // for student; this will cause a faulty error in DB due to null PK

    await expect(
      accMngService.createStudentWithParentAccount(
        'rollbackUser',
        'Rollback Test',
        'rollbackParent@gmail.com',
        'Parent Rollback',
        teacherId as string,
      ),
    ).rejects.toThrow();

    randomUUIDV7Mock.mockRestore();

    const parent: Parent | null = await app
      .get(DataSource)
      .getRepository(Parent)
      .findOne({ where: { email: 'rollbackParent@gmail.com' } });

    const student: Student | null = await app
      .get(DataSource)
      .getRepository(Student)
      .findOne({ where: { username: 'rollbackUser' } });

    expect(student).toBeNull();
    expect(parent).toBeNull();
  });

  it('POST /teachers/students | must register a student and it parent if request is valid <with excluded sensitive data>', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('username', 'student1');
    expect(body).toHaveProperty('fullName', 'Student One');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
    expect(body).toHaveProperty('teacher');
    expect(body.teacher).toHaveProperty('id');
    expect(body.teacher).toHaveProperty('email', 'teacher1@gmail.com');
    expect(body.teacher).toHaveProperty('username', 'teacher1');
    expect(body.teacher).toHaveProperty('fullName', 'Teacher One');
    expect(body.teacher).not.toHaveProperty('password');
    expect(body.teacher).not.toHaveProperty('token');
    expect(body.teacher).toHaveProperty('schoolName', 'School Name 1');
    expect(body.teacher).toHaveProperty('createdAt');
    expect(body.teacher).toHaveProperty('updatedAt');
    expect(body).toHaveProperty('parent');
    expect(body.parent).toHaveProperty('id');
    expect(body.parent).toHaveProperty('username', 'parent1');
    expect(body.parent).toHaveProperty('email', 'parent1@gmail.com');
    expect(body.parent).toHaveProperty('fullName', 'Parent One');
    expect(body.parent).not.toHaveProperty('password');
    expect(body.parent).not.toHaveProperty('token');
    expect(body.parent).toHaveProperty('createdAt');
    expect(body.parent).toHaveProperty('updatedAt');

    const studentInDb = await dataSource.getRepository(Student).findOne({
      where: { id: body.id },
      relations: ['parent', 'teacher'],
    });
    expect(studentInDb).toBeDefined();
    expect(studentInDb).toHaveProperty('username', 'student1');
    expect(studentInDb).toHaveProperty('fullName', 'Student One');
    const parentInDb: Parent | null = await dataSource
      .getRepository(Parent)
      .findOne({
        where: { id: studentInDb!.parent.id },
        relations: ['students'],
      });
    expect(parentInDb).toBeDefined();
    expect(parentInDb).toHaveProperty('username', 'parent1');
    expect(parentInDb).toHaveProperty('email', 'parent1@gmail.com');
    expect(parentInDb).toHaveProperty('fullName', 'Parent One');
    expect(parentInDb?.students).toHaveLength(1);
    expect(parentInDb?.students[0]).toHaveProperty('id', studentInDb!.id);
    const teacherInDb: Teacher | null = await dataSource
      .getRepository(Teacher)
      .findOne({
        where: { id: body.teacher.id },
        relations: ['students'],
      });
    expect(teacherInDb).toBeDefined();
    expect(teacherInDb?.students).toHaveLength(1);
    expect(teacherInDb?.students[0]).toHaveProperty('id', studentInDb!.id);

    const levelProgressInDb: LevelProgress[] = await dataSource
      .getRepository(LevelProgress)
      .find({
        where: { student: { id: studentInDb!.id } },
      });
    expect(levelProgressInDb).toHaveLength(0);
  });

  it('POST /teachers/students | must register a second student with same parent as the first student if request is valid', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // first register student 1
    const response1 = await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    const body1 = response1.body.data;

    // try to register second student  with same parent
    const response2 = await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student2',
        studentFullName: 'Student Two',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const body2 = response2.body.data;
    expect(body2).toHaveProperty('id');
    expect(body2).toHaveProperty('username', 'student2');
    expect(body2).toHaveProperty('fullName', 'Student Two');
    expect(body2).not.toHaveProperty('password');
    expect(body2).not.toHaveProperty('token');
    expect(body2).toHaveProperty('createdAt');
    expect(body2).toHaveProperty('updatedAt');
    expect(body2).toHaveProperty('teacher');
    expect(body2.teacher).toHaveProperty('id');
    expect(body2.teacher).toHaveProperty('email', 'teacher1@gmail.com');
    expect(body2.teacher).toHaveProperty('username', 'teacher1');
    expect(body2.teacher).toHaveProperty('fullName', 'Teacher One');
    expect(body2.teacher).not.toHaveProperty('password');
    expect(body2.teacher).not.toHaveProperty('token');
    expect(body2.teacher).toHaveProperty('schoolName', 'School Name 1');
    expect(body2.teacher).toHaveProperty('createdAt');
    expect(body2.teacher).toHaveProperty('updatedAt');
    expect(body2).toHaveProperty('parent');
    expect(body2.parent).toHaveProperty('id');
    expect(body2.parent).toHaveProperty('username', 'parent1');
    expect(body2.parent).toHaveProperty('email', 'parent1@gmail.com');
    expect(body2.parent).toHaveProperty('fullName', 'Parent One');
    expect(body2.parent).not.toHaveProperty('password');
    expect(body2.parent).not.toHaveProperty('token');
    expect(body2.parent).toHaveProperty('createdAt');
    expect(body2.parent).toHaveProperty('updatedAt');

    const studentInDb1 = await dataSource.getRepository(Student).findOne({
      where: { id: body1.id },
      relations: ['parent', 'teacher'],
    });
    const studentInDb2 = await dataSource.getRepository(Student).findOne({
      where: { id: body2.id },
      relations: ['parent', 'teacher'],
    });
    expect(studentInDb2).toBeDefined();
    expect(studentInDb2).toHaveProperty('username', 'student2');
    expect(studentInDb2).toHaveProperty('fullName', 'Student Two');
    const parentInDb: Parent | null = await dataSource
      .getRepository(Parent)
      .findOne({
        where: { id: studentInDb2!.parent.id },
        relations: ['students'],
      });
    expect(parentInDb).toBeDefined();
    expect(parentInDb).toHaveProperty('username', 'parent1');
    expect(parentInDb).toHaveProperty('email', 'parent1@gmail.com');
    expect(parentInDb).toHaveProperty('fullName', 'Parent One');
    expect(parentInDb?.students).toHaveLength(2);
    expect(parentInDb?.students[0]).toHaveProperty('id', studentInDb1!.id);
    expect(parentInDb?.students[1]).toHaveProperty('id', studentInDb2!.id);
    const teacherInDb: Teacher | null = await dataSource
      .getRepository(Teacher)
      .findOne({
        where: { id: body2.teacher.id },
        relations: ['students'],
      });
    expect(teacherInDb).toBeDefined();
    expect(teacherInDb?.students).toHaveLength(2);
    expect(teacherInDb?.students[0]).toHaveProperty('id', studentInDb1!.id);
    expect(teacherInDb?.students[1]).toHaveProperty('id', studentInDb2!.id);
  });

  it('POST /teachers/students | must handle jumped level for a student', async () => {
    const levelSeeder: LevelSeeder = new LevelSeeder(dataSource);
    await levelSeeder.run();

    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
        jumpLevelTo: 2,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const body = response.body.data;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('username', 'student1');
    expect(body).toHaveProperty('fullName', 'Student One');
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
    expect(body).toHaveProperty('teacher');
    expect(body.teacher).toHaveProperty('id');
    expect(body.teacher).toHaveProperty('email', 'teacher1@gmail.com');
    expect(body.teacher).toHaveProperty('username', 'teacher1');
    expect(body.teacher).toHaveProperty('fullName', 'Teacher One');
    expect(body.teacher).not.toHaveProperty('password');
    expect(body.teacher).not.toHaveProperty('token');
    expect(body.teacher).toHaveProperty('schoolName', 'School Name 1');
    expect(body.teacher).toHaveProperty('createdAt');
    expect(body.teacher).toHaveProperty('updatedAt');
    expect(body).toHaveProperty('parent');
    expect(body.parent).toHaveProperty('id');
    expect(body.parent).toHaveProperty('username', 'parent1');
    expect(body.parent).toHaveProperty('email', 'parent1@gmail.com');
    expect(body.parent).toHaveProperty('fullName', 'Parent One');
    expect(body.parent).not.toHaveProperty('password');
    expect(body.parent).not.toHaveProperty('token');
    expect(body.parent).toHaveProperty('createdAt');
    expect(body.parent).toHaveProperty('updatedAt');

    const studentInDb = await dataSource.getRepository(Student).findOne({
      where: { id: body.id },
      relations: ['parent', 'teacher'],
    });
    expect(studentInDb).toBeDefined();
    expect(studentInDb).toHaveProperty('username', 'student1');
    expect(studentInDb).toHaveProperty('fullName', 'Student One');
    const parentInDb: Parent | null = await dataSource
      .getRepository(Parent)
      .findOne({
        where: { id: studentInDb!.parent.id },
        relations: ['students'],
      });
    expect(parentInDb).toBeDefined();
    expect(parentInDb).toHaveProperty('username', 'parent1');
    expect(parentInDb).toHaveProperty('email', 'parent1@gmail.com');
    expect(parentInDb).toHaveProperty('fullName', 'Parent One');
    expect(parentInDb?.students).toHaveLength(1);
    expect(parentInDb?.students[0]).toHaveProperty('id', studentInDb!.id);
    const teacherInDb: Teacher | null = await dataSource
      .getRepository(Teacher)
      .findOne({
        where: { id: body.teacher.id },
        relations: ['students'],
      });
    expect(teacherInDb).toBeDefined();
    expect(teacherInDb?.students).toHaveLength(1);
    expect(teacherInDb?.students[0]).toHaveProperty('id', studentInDb!.id);

    const levelProgressInDb: LevelProgress[] = await dataSource
      .getRepository(LevelProgress)
      .find({
        where: { student: { id: studentInDb!.id } },
        relations: ['level', 'student'],
      });

    expect(levelProgressInDb).toHaveLength(3);
    expect(levelProgressInDb[0]).toHaveProperty('level.no', 1);
    expect(levelProgressInDb[0]).toHaveProperty('isUnlocked', true);
    expect(levelProgressInDb[0]).toHaveProperty('isSkipped', true);
    expect(levelProgressInDb[0]).toHaveProperty('isCompleted', true);
    expect(levelProgressInDb[1]).toHaveProperty('level.no', 2);
    expect(levelProgressInDb[1]).toHaveProperty('isUnlocked', true);
    expect(levelProgressInDb[1]).toHaveProperty('isSkipped', true);
    expect(levelProgressInDb[1]).toHaveProperty('isCompleted', true);
    expect(levelProgressInDb[2]).toHaveProperty('level.no', 3);
    expect(levelProgressInDb[2]).toHaveProperty('isUnlocked', true);
    expect(levelProgressInDb[2]).toHaveProperty('isSkipped', false);
    expect(levelProgressInDb[2]).toHaveProperty('isCompleted', false);
  });

  it('POST /teachers/students | must reject if jumped level is invalid (lt 1, gt levels length) ', async () => {
    const levelSeeder: LevelSeeder = new LevelSeeder(dataSource);
    await levelSeeder.run();

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
        jumpLevelTo: -1,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
        jumpLevelTo: 0,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
        jumpLevelTo: 99999,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('POST /teachers/students | must reject a student and NEW parent if parent fullName is empty', async () => {
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
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /teachers/students/parents-email | must return empty array if no parent emails exist', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .get('/teachers/students/parents-email')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it('GET /teachers/students/parents-email | must return array of parent emails and fullnames sorted by email', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // register student 1
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

    // register student 2
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student2',
        studentFullName: 'Student Two',
        parentEmail: 'aparent2@gmail.com',
        parentFullName: 'Parent Two Aparent',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const response = await requestTestAgent
      .get('/teachers/students/parents-email')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0].email).toBe('aparent2@gmail.com');
    expect(body[0].fullName).toBe('Parent Two Aparent');
    expect(body[1].email).toBe('parent1@gmail.com');
    expect(body[1].fullName).toBe('Parent One');
  });

  it('GET /teachers/students/parents-email | must return array of parent emails and fullnames sorted by email even the parent didnt have an child yet', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    await dataSource.getRepository(Parent).save([
      {
        id: 'parent-0001',
        username: 'aparent2',
        email: 'parent1@gmail.com',
        fullName: 'Parent One',
        password: await bcrypt.hash('somepassword', 10),
      },
      {
        id: 'parent-0002',
        username: 'parent2',
        email: 'aparent2@gmail.com',
        fullName: 'Parent Two Aparent',
        password: await bcrypt.hash('somepassword', 10),
      },
    ]);

    const response = await requestTestAgent
      .get('/teachers/students/parents-email')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body.data;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0].email).toBe('aparent2@gmail.com');
    expect(body[0].fullName).toBe('Parent Two Aparent');
    expect(body[1].email).toBe('parent1@gmail.com');
    expect(body[1].fullName).toBe('Parent One');
  });

  it('GET /teachers/students/parents-email | must reject if invalid token or unauthorized', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    await requestTestAgent
      .get('/teachers/students/parents-email')
      .set('Authorization', `Bearer ${token}+invalid-part`)
      .expect(401);
  });

  it('GET /teachers/students/parents-email | must reject if user accessed is not a teacher', async () => {
    // create a student account
    await dataSource.getRepository(Student).save({
      id: '0001',
      username: 'student1',
      password: await bcrypt.hash('student1password', 10),
      fullName: 'Student One',
    });

    // sign in as student
    const signInResponse = await requestTestAgent
      .post('/auth/students/login')
      .send({
        username: 'student1',
        password: 'student1password',
      })
      .expect(200);
    const studentToken = signInResponse.body.data.token;

    // should reject access
    await requestTestAgent
      .get('/teachers/students/parents-email')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('POST /teachers/students | must reject if student already exist', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token = signInResponse.body.data.token;

    // first register student 1
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

    // try to register student 1 again with same username
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student Two',
        parentEmail: 'parent2@gmail.com',
        parentFullName: 'Parent Two',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('POST /teachers/students | must reject if other teacher register a student with same username', async () => {
    const signInResponse1 = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher1@gmail.com',
        password: 'teacher1password',
      })
      .expect(200);
    const token1 = signInResponse1.body.data.token;
    const signInResponse2 = await requestTestAgent
      .post('/auth/teachers/login')
      .send({
        email: 'teacher2@gmail.com',
        password: 'teacher2password',
      })
      .expect(200);
    const token2 = signInResponse2.body.data.token;

    // first register student for teacher 1
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token1}`)
      .expect(201);

    // try to register student 1 again with same username by teacher 2
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student Two',
        parentEmail: 'parent2@gmail.com',
        parentFullName: 'Parent Two',
      })
      .set('Authorization', `Bearer ${token2}`)
      .expect(400);
  });

  it('POST /teachers/students | must handle parent email with special characters for username generation', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({ email: 'teacher1@gmail.com', password: 'teacher1password' })
      .expect(200);
    const token = signInResponse.body.data.token;

    const response = await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent.test+tag@gmail.com', // Special chars in local part
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const body = response.body.data;
    expect(body.parent).toHaveProperty('username', 'parent.test+tag');
    expect(body.parent).toHaveProperty('email', 'parent.test+tag@gmail.com');
  });

  it('POST /teachers/students | must reject if parent email generates invalid username', async () => {
    const signInResponse = await requestTestAgent
      .post('/auth/teachers/login')
      .send({ email: 'teacher1@gmail.com', password: 'teacher1password' })
      .expect(200);
    const token = signInResponse.body.data.token;

    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent with spaces@gmail.com', // Invalid for username
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('POST /teachers/students | must reject if student username have a spaces ( )', async () => {
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
        studentUsername: 'student 1 2 spaces',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('POST /teachers/students | must reject if request body is invalid', async () => {
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
        studentUsername: 'student 1 2 spaces',
        studentFullName: 'Student One VERYLONGNAMEEXCEEDSLIMITNAMEEXCEEDSLIMIT',
        parentEmail: 'parent1 gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('POST /teachers/students | must reject if un-authenticated (no token)', async () => {
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .expect(401);
  });

  it('POST /teachers/students | must reject if token is invalid', async () => {
    await requestTestAgent
      .post('/teachers/students')
      .send({
        studentUsername: 'student1',
        studentFullName: 'Student One',
        parentEmail: 'parent1@gmail.com',
        parentFullName: 'Parent One',
      })
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
