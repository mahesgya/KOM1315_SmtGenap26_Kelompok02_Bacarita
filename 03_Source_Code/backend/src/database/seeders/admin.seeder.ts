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

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new Error(`Missing required config value: ${key}`);
    }

    return value;
  }

  async run(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const adminRepo: Repository<Admin> = manager.getRepository(Admin);

      const adminsData = [
        {
          id: uuidv4(),
          email: this.getRequiredConfig('ADMIN_EMAIL'),
          username: this.getRequiredConfig('ADMIN_USERNAME'),
          fullName: this.getRequiredConfig('ADMIN_FULL_NAME'),
          password: this.getRequiredConfig('ADMIN_PASSWORD'),
        },
      ];

      for (const adminData of adminsData) {
        const existingAdmin = await adminRepo.findOne({
          where: [{ email: adminData.email }, { username: adminData.username }],
        });

        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        if (existingAdmin) {
          existingAdmin.email = adminData.email;
          existingAdmin.username = adminData.username;
          existingAdmin.fullName = adminData.fullName;
          existingAdmin.password = hashedPassword;
          existingAdmin.failedLoginAttempts = 0;
          existingAdmin.lockedUntil = null;
          await adminRepo.save(existingAdmin);
        } else {
          const admin = adminRepo.create({
            ...adminData,
            password: hashedPassword,
            token: null,
            failedLoginAttempts: 0,
            lockedUntil: null,
          });
          await adminRepo.save(admin);
        }
      }
    });
  }
}
