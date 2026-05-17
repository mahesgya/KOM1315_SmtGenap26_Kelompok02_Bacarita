import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCuratorsTabler1764316080802 implements MigrationInterface {
  name = 'CreateCuratorsTabler1764316080802';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`curators\` (\`id\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`username\` varchar(90) NOT NULL, \`fullName\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`token\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_42b1270e8299ae95199406d37f\` (\`email\`), UNIQUE INDEX \`IDX_1fffa4d77b708b055ff40434ef\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_1fffa4d77b708b055ff40434ef\` ON \`curators\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_42b1270e8299ae95199406d37f\` ON \`curators\``,
    );
    await queryRunner.query(`DROP TABLE \`curators\``);
  }
}
