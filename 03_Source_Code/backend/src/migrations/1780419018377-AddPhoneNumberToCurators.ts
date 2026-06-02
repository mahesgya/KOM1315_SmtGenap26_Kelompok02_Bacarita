import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneNumberToCurators1780419018377
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`curators\` ADD COLUMN \`phoneNumber\` TEXT NULL AFTER \`fullName\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`curators\` DROP COLUMN \`phoneNumber\``,
    );
  }
}
