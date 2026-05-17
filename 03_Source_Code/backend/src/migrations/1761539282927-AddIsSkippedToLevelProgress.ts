import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsSkippedToLevelProgress1761539282927
  implements MigrationInterface
{
  name = 'AddIsSkippedToLevelProgress1761539282927';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`level_progresses\` ADD \`isSkipped\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`level_progresses\` DROP COLUMN \`isSkipped\``,
    );
  }
}
