import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoryApprovalLogsTable1764352240811
  implements MigrationInterface
{
  name = 'CreateStoryApprovalLogsTable1764352240811';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`story_approval_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`story_id\` int NOT NULL,
        \`from_status\` enum('ACCEPTED', 'WAITING', 'WAITING_NEWLY', 'REJECTED') NOT NULL,
        \`to_status\` enum('ACCEPTED', 'WAITING', 'WAITING_NEWLY', 'REJECTED') NOT NULL,
        \`reason\` text NULL,
        \`curator_id\` varchar(255) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_story_approval_logs_story\` FOREIGN KEY (\`story_id\`) REFERENCES \`stories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_story_approval_logs_curator\` FOREIGN KEY (\`curator_id\`) REFERENCES \`curators\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`story_approval_logs\` DROP FOREIGN KEY \`FK_story_approval_logs_curator\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`story_approval_logs\` DROP FOREIGN KEY \`FK_story_approval_logs_story\``,
    );
    await queryRunner.query(`DROP TABLE \`story_approval_logs\``);
  }
}
