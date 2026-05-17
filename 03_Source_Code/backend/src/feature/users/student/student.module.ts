import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
