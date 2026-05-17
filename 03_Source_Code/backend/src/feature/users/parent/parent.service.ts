import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from '../entities/parent.entity';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
  ) {}

  public async findByEmail(email: string): Promise<Parent | null> {
    return this.parentRepository.findOneBy({ email });
  }

  public async findByUsername(username: string): Promise<Parent | null> {
    return this.parentRepository.findOneBy({ username });
  }

  public async findById(id: string): Promise<Parent | null> {
    return this.parentRepository.findOneBy({ id });
  }

  public async save(parent: Parent): Promise<Parent> {
    return this.parentRepository.save(parent);
  }
}
