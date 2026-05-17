import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminTable1763222315525 implements MigrationInterface {
  name = 'CreateAdminTable1763222315525';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`admins\` (\`id\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`username\` varchar(90) NOT NULL, \`fullName\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`token\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_051db7d37d478a69a7432df147\` (\`email\`), UNIQUE INDEX \`IDX_4ba6d0c734d53f8e1b2e24b6c5\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_4ba6d0c734d53f8e1b2e24b6c5\` ON \`admins\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_051db7d37d478a69a7432df147\` ON \`admins\``,
    );
    await queryRunner.query(`DROP TABLE \`admins\``);
  }
}
