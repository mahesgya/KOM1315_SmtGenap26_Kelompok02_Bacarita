import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityColumns1768780000001 implements MigrationInterface {
  name = 'AddSecurityColumns1768780000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add security columns to teachers
    await queryRunner.query(
      `ALTER TABLE \`teachers\` ADD \`failedLoginAttempts\` INT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`teachers\` ADD \`lockedUntil\` DATETIME NULL`,
    );

    // Add security columns to students
    await queryRunner.query(
      `ALTER TABLE \`students\` ADD \`failedLoginAttempts\` INT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`students\` ADD \`lockedUntil\` DATETIME NULL`,
    );

    // Add security columns to parents
    await queryRunner.query(
      `ALTER TABLE \`parents\` ADD \`failedLoginAttempts\` INT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`parents\` ADD \`lockedUntil\` DATETIME NULL`,
    );

    // Add security columns to admins
    await queryRunner.query(
      `ALTER TABLE \`admins\` ADD \`failedLoginAttempts\` INT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` ADD \`lockedUntil\` DATETIME NULL`,
    );

    // Add security columns to curators
    await queryRunner.query(
      `ALTER TABLE \`curators\` ADD \`failedLoginAttempts\` INT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`curators\` ADD \`lockedUntil\` DATETIME NULL`,
    );

    // Add resultSignature to test_sessions
    await queryRunner.query(
      `ALTER TABLE \`test_sessions\` ADD \`resultSignature\` VARCHAR(255) NULL`,
    );

    // Create auth_audit_logs table
    await queryRunner.query(
      `CREATE TABLE \`auth_audit_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`userId\` VARCHAR(255) NULL,
        \`role\` ENUM('admin','teacher','student','parent','curator') NULL,
        \`event\` ENUM('LOGIN_OK','LOGIN_FAIL','LOGOUT','LOCKED') NOT NULL,
        \`ipAddress\` VARCHAR(45) NULL,
        \`userAgent\` TEXT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop auth_audit_logs table
    await queryRunner.query(`DROP TABLE \`auth_audit_logs\``);

    // Remove resultSignature from test_sessions
    await queryRunner.query(
      `ALTER TABLE \`test_sessions\` DROP COLUMN \`resultSignature\``,
    );

    // Remove security columns from curators
    await queryRunner.query(
      `ALTER TABLE \`curators\` DROP COLUMN \`lockedUntil\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`curators\` DROP COLUMN \`failedLoginAttempts\``,
    );

    // Remove security columns from admins
    await queryRunner.query(
      `ALTER TABLE \`admins\` DROP COLUMN \`lockedUntil\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` DROP COLUMN \`failedLoginAttempts\``,
    );

    // Remove security columns from parents
    await queryRunner.query(
      `ALTER TABLE \`parents\` DROP COLUMN \`lockedUntil\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`parents\` DROP COLUMN \`failedLoginAttempts\``,
    );

    // Remove security columns from students
    await queryRunner.query(
      `ALTER TABLE \`students\` DROP COLUMN \`lockedUntil\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`students\` DROP COLUMN \`failedLoginAttempts\``,
    );

    // Remove security columns from teachers
    await queryRunner.query(
      `ALTER TABLE \`teachers\` DROP COLUMN \`lockedUntil\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`teachers\` DROP COLUMN \`failedLoginAttempts\``,
    );
  }
}
