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

  async run(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const curatorRepo: Repository<Curator> = manager.getRepository(Curator);

      const curatorsData = [
        {
          id: uuidv4(),
          email: this.configService.get<string>('CURATOR_EMAIL')!,
          username: this.configService.get<string>('CURATOR_USERNAME')!,
          fullName: this.configService.get<string>('CURATOR_FULL_NAME')!,
          password: this.configService.get<string>('CURATOR_PASSWORD')!,
        },
      ];

      for (const curatorData of curatorsData) {
        const existingCurator = await curatorRepo.findOne({
          where: [
            { email: curatorData.email },
            { username: curatorData.username },
          ],
        });

        if (!existingCurator) {
          const hashedPassword = await bcrypt.hash(curatorData.password, 10);
          const curator = curatorRepo.create({
            ...curatorData,
            password: hashedPassword,
            token: null,
          });
          await curatorRepo.save(curator);
        }
      }
    });
  }
}
