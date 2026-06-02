import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiAuditLogsTable1768800000000 implements MigrationInterface {
  name = 'CreateApiAuditLogsTable1768800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`api_audit_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`userId\` VARCHAR(255) NULL,
        \`role\` ENUM('admin','teacher','student','parent','curator') NULL,
        \`method\` VARCHAR(10) NOT NULL,
        \`endpoint\` VARCHAR(500) NOT NULL,
        \`statusCode\` INT NULL,
        \`durationMs\` INT NULL,
        \`ipAddress\` VARCHAR(45) NULL,
        \`userAgent\` TEXT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_api_audit_logs_role\` (\`role\`),
        INDEX \`IDX_api_audit_logs_endpoint\` (\`endpoint\`(191)),
        INDEX \`IDX_api_audit_logs_created_at\` (\`createdAt\`)
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`api_audit_logs\``);
  }
}
