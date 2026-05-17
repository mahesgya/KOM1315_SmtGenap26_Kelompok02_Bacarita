import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTestSessionTable1761585761537 implements MigrationInterface {
  name = 'CreateTestSessionTable1761585761537';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`test_sessions\` (\`id\` varchar(255) NOT NULL, \`titleAtTaken\` varchar(255) NOT NULL, \`imageAtTaken\` varchar(255) NULL, \`descriptionAtTaken\` longtext NULL, \`passageAtTaken\` longtext NOT NULL, \`startedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`finishedAt\` datetime NULL, \`medal\` enum ('GOLD', 'SILVER', 'BRONZE', 'NONE') NULL, \`score\` float NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`studentId\` varchar(255) NULL, \`storyId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`test_sessions\` ADD CONSTRAINT \`FK_ba662c6511336c7983e0f2704b1\` FOREIGN KEY (\`studentId\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`test_sessions\` ADD CONSTRAINT \`FK_d7197d2254bac9702db81d2d311\` FOREIGN KEY (\`storyId\`) REFERENCES \`stories\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`test_sessions\` DROP FOREIGN KEY \`FK_d7197d2254bac9702db81d2d311\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`test_sessions\` DROP FOREIGN KEY \`FK_ba662c6511336c7983e0f2704b1\``,
    );
    await queryRunner.query(`DROP TABLE \`test_sessions\``);
  }
}
