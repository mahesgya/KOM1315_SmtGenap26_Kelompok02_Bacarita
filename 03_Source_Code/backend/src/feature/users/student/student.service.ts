import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  public async findById(studentId: string): Promise<Student | null> {
    return this.studentRepository.findOneBy({ id: studentId });
  }

  public async findByUsername(username: string): Promise<Student | null> {
    return this.studentRepository.findOneBy({ username });
  }

  public async save(student: Student): Promise<Student> {
    return this.studentRepository.save(student);
  }
}
