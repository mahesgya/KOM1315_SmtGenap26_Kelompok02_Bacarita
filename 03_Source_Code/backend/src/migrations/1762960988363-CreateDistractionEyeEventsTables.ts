import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDistractionEyeEventsTables1762960988363
  implements MigrationInterface
{
  name = 'CreateDistractionEyeEventsTables1762960988363';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`distracted_eye_events\` (\`id\` varchar(255) NOT NULL, \`distractionType\` enum ('FOCUS', 'TURNING', 'GLANCE', 'NOT_DETECTED') NOT NULL, \`triggerDurationMs\` int NOT NULL, \`occurredAtWord\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`test_session_id\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`distracted_eye_events_summaries\` (\`id\` varchar(255) NOT NULL, \`totalSessionDurationSec\` float NOT NULL, \`timeBreakdownFocus\` float NOT NULL, \`timeBreakdownTurning\` float NOT NULL, \`timeBreakdownGlance\` float NOT NULL, \`timeBreakdownNotDetected\` float NOT NULL, \`turningTriggersCount\` int NOT NULL, \`glanceTriggersCount\` int NOT NULL, \`avgPoseVariance\` float NOT NULL, \`longFixationCount\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`test_session_id\` varchar(255) NULL, UNIQUE INDEX \`REL_3c3f9d9e66046a74eed86962df\` (\`test_session_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`distracted_eye_events\` ADD CONSTRAINT \`FK_336bc0a41aed8e6df5128da1b5a\` FOREIGN KEY (\`test_session_id\`) REFERENCES \`test_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`distracted_eye_events_summaries\` ADD CONSTRAINT \`FK_3c3f9d9e66046a74eed86962df2\` FOREIGN KEY (\`test_session_id\`) REFERENCES \`test_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`distracted_eye_events_summaries\` DROP FOREIGN KEY \`FK_3c3f9d9e66046a74eed86962df2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`distracted_eye_events\` DROP FOREIGN KEY \`FK_336bc0a41aed8e6df5128da1b5a\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_3c3f9d9e66046a74eed86962df\` ON \`distracted_eye_events_summaries\``,
    );
    await queryRunner.query(`DROP TABLE \`distracted_eye_events_summaries\``);
    await queryRunner.query(`DROP TABLE \`distracted_eye_events\``);
  }
}
