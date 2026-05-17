import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSTTWordResultsTable1761754541374
  implements MigrationInterface
{
  name = 'CreateSTTWordResultsTable1761754541374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`stt_word_results\` (\`id\` varchar(255) NOT NULL, \`instruction\` longtext NULL, \`expectedWord\` varchar(255) NOT NULL, \`spokenWord\` varchar(255) NULL, \`accuracy\` float NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`test_session_id\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stt_word_results\` ADD CONSTRAINT \`FK_f49f4059b964c7d8711baad1328\` FOREIGN KEY (\`test_session_id\`) REFERENCES \`test_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stt_word_results\` DROP FOREIGN KEY \`FK_f49f4059b964c7d8711baad1328\``,
    );
    await queryRunner.query(`DROP TABLE \`stt_word_results\``);
  }
}
