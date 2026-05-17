import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curator } from '../entities/curator.entity';

@Injectable()
export class CuratorService {
  constructor(
    @InjectRepository(Curator)
    private readonly curatorRepository: Repository<Curator>,
  ) {}

  async findById(id: string): Promise<Curator | null> {
    return this.curatorRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Curator | null> {
    return this.curatorRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<Curator | null> {
    return this.curatorRepository.findOne({ where: { username } });
  }

  async save(curator: Curator): Promise<Curator> {
    return this.curatorRepository.save(curator);
  }
}
