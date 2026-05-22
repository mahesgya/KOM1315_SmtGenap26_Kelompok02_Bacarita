import { Curator } from 'src/feature/users/entities/curator.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

export class CuratorSeeder {
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
      const curatorRepo: Repository<Curator> = manager.getRepository(Curator);

      const curatorsData = [
        {
          id: uuidv4(),
          email: this.getRequiredConfig('CURATOR_EMAIL'),
          username: this.getRequiredConfig('CURATOR_USERNAME'),
          fullName: this.getRequiredConfig('CURATOR_FULL_NAME'),
          password: this.getRequiredConfig('CURATOR_PASSWORD'),
        },
      ];

      for (const curatorData of curatorsData) {
        const existingCurator = await curatorRepo.findOne({
          where: [
            { email: curatorData.email },
            { username: curatorData.username },
          ],
        });

        const hashedPassword = await bcrypt.hash(curatorData.password, 10);

        if (existingCurator) {
          existingCurator.email = curatorData.email;
          existingCurator.username = curatorData.username;
          existingCurator.fullName = curatorData.fullName;
          existingCurator.password = hashedPassword;
          existingCurator.failedLoginAttempts = 0;
          existingCurator.lockedUntil = null;
          await curatorRepo.save(existingCurator);
        } else {
          const curator = curatorRepo.create({
            ...curatorData,
            password: hashedPassword,
            token: null,
            failedLoginAttempts: 0,
            lockedUntil: null,
          });
          await curatorRepo.save(curator);
        }
      }
    });
  }
}
