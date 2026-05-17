import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenGeneratorModule } from 'src/common/token-generator/token-generator.module';
import { LevelsModule } from '../levels/levels.module';
import { Admin } from './entities/admin.entity';
import { Curator } from './entities/curator.entity';
import { Parent } from './entities/parent.entity';
import { Student } from './entities/student.entity';
import { Teacher } from './entities/teacher.entity';
import { AdminModule } from './admin/admin.module';
import { CuratorModule } from './curator/curator.module';
import { ParentModule } from './parent/parent.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Parent, Student, Teacher, Admin, Curator]),
    LevelsModule,
    ParentModule,
    StudentModule,
    TeacherModule,
    AdminModule,
    CuratorModule,
    TokenGeneratorModule,
  ],
})
export class UsersModule {}
