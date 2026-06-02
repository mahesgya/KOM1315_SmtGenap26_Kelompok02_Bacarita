import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Widens PII columns from VARCHAR(255) to TEXT to accommodate
 * AES-256-CBC ciphertext (ivHex:ciphertextHex format).
 *
 * DB uses camelCase column names (TypeORM default naming strategy).
 * test_sessions.descriptionAtTaken and passageAtTaken are already longtext — no change needed.
 */
export class AesEncryptPiiColumns1780417570892 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`students\` MODIFY COLUMN \`fullName\` TEXT NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`parents\` MODIFY COLUMN \`fullName\` TEXT NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`teachers\` MODIFY COLUMN \`fullName\` TEXT NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`teachers\` MODIFY COLUMN \`schoolName\` TEXT NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` MODIFY COLUMN \`fullName\` TEXT NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`curators\` MODIFY COLUMN \`fullName\` TEXT NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`students\` MODIFY COLUMN \`fullName\` VARCHAR(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`parents\` MODIFY COLUMN \`fullName\` VARCHAR(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`teachers\` MODIFY COLUMN \`fullName\` VARCHAR(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`teachers\` MODIFY COLUMN \`schoolName\` VARCHAR(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` MODIFY COLUMN \`fullName\` VARCHAR(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`curators\` MODIFY COLUMN \`fullName\` VARCHAR(255) NOT NULL`,
    );
  }
}
