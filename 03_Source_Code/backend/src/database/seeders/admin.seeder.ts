import { Admin } from 'src/feature/users/entities/admin.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

export class AdminSeeder {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async run(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const adminRepo: Repository<Admin> = manager.getRepository(Admin);

      const adminsData = [
        {
          id: uuidv4(),
          email: this.configService.get<string>('ADMIN_EMAIL')!,
          username: this.configService.get<string>('ADMIN_USERNAME')!,
          fullName: this.configService.get<string>('ADMIN_FULL_NAME')!,
          password: this.configService.get<string>('ADMIN_PASSWORD')!,
        },
      ];

      for (const adminData of adminsData) {
        const existingAdmin = await adminRepo.findOne({
          where: [{ email: adminData.email }, { username: adminData.username }],
        });

        if (!existingAdmin) {
          const hashedPassword = await bcrypt.hash(adminData.password, 10);
          const admin = adminRepo.create({
            ...adminData,
            password: hashedPassword,
            token: null,
          });
          await adminRepo.save(admin);
        }
      }
    });
  }
}
