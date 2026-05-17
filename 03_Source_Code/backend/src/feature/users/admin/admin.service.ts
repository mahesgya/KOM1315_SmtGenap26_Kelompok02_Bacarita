import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async findById(id: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { username } });
  }

  async save(admin: Admin): Promise<Admin> {
    return this.adminRepository.save(admin);
  }
}
