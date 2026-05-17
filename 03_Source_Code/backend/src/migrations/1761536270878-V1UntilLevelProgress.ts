import { MigrationInterface, QueryRunner } from 'typeorm';

export class V1UntilLevelProgress1761536270878 implements MigrationInterface {
  name = 'V1UntilLevelProgress1761536270878';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`stories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`description\` longtext NULL, \`image\` varchar(255) NULL, \`passage\` longtext NOT NULL, \`status\` enum ('ACCEPTED', 'WAITING', 'WAITING_NEWLY', 'REJECTED') NOT NULL DEFAULT 'WAITING_NEWLY', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`level_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`levels\` (\`id\` int NOT NULL AUTO_INCREMENT, \`no\` int NOT NULL, \`name\` varchar(90) NOT NULL, \`isBonusLevel\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`teacher_id\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`level_progresses\` (\`student_id\` varchar(255) NOT NULL, \`level_id\` int NOT NULL, \`isUnlocked\` tinyint NOT NULL DEFAULT 0, \`goldCount\` int NOT NULL DEFAULT '0', \`silverCount\` int NOT NULL DEFAULT '0', \`bronzeCount\` int NOT NULL DEFAULT '0', \`isCompleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`student_id\`, \`level_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`parents\` (\`id\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`username\` varchar(90) NOT NULL, \`fullName\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`token\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_07b4151ae2a983823d922d5cf0\` (\`email\`), UNIQUE INDEX \`IDX_a306e301d01e1530492e35fccb\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`students\` (\`id\` varchar(255) NOT NULL, \`username\` varchar(90) NOT NULL, \`fullName\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`token\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`teacher_id\` varchar(255) NULL, \`parent_id\` varchar(255) NULL, UNIQUE INDEX \`IDX_fa8c3b4233deabc0917380ef4e\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`teachers\` (\`id\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`username\` varchar(90) NOT NULL, \`fullName\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`schoolName\` varchar(255) NOT NULL, \`token\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_7568c49a630907119e4a665c60\` (\`email\`), UNIQUE INDEX \`IDX_8ba8ec906be52d8fc27331e88c\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stories\` ADD CONSTRAINT \`FK_1e53dfd944df0c4468bfd640354\` FOREIGN KEY (\`level_id\`) REFERENCES \`levels\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`levels\` ADD CONSTRAINT \`FK_5a0e1dfdb065020ee83c5fe32a9\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`level_progresses\` ADD CONSTRAINT \`FK_4042565e705e245dca3abf59cb2\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`level_progresses\` ADD CONSTRAINT \`FK_a4a99d4d215f4d365cff389bb52\` FOREIGN KEY (\`level_id\`) REFERENCES \`levels\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`students\` ADD CONSTRAINT \`FK_7ebb0e1088455cdde747e1c8eb7\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`students\` ADD CONSTRAINT \`FK_209313beb8d3f51f7ad69214d90\` FOREIGN KEY (\`parent_id\`) REFERENCES \`parents\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`students\` DROP FOREIGN KEY \`FK_209313beb8d3f51f7ad69214d90\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`students\` DROP FOREIGN KEY \`FK_7ebb0e1088455cdde747e1c8eb7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`level_progresses\` DROP FOREIGN KEY \`FK_a4a99d4d215f4d365cff389bb52\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`level_progresses\` DROP FOREIGN KEY \`FK_4042565e705e245dca3abf59cb2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`levels\` DROP FOREIGN KEY \`FK_5a0e1dfdb065020ee83c5fe32a9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stories\` DROP FOREIGN KEY \`FK_1e53dfd944df0c4468bfd640354\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8ba8ec906be52d8fc27331e88c\` ON \`teachers\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_7568c49a630907119e4a665c60\` ON \`teachers\``,
    );
    await queryRunner.query(`DROP TABLE \`teachers\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_fa8c3b4233deabc0917380ef4e\` ON \`students\``,
    );
    await queryRunner.query(`DROP TABLE \`students\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a306e301d01e1530492e35fccb\` ON \`parents\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_07b4151ae2a983823d922d5cf0\` ON \`parents\``,
    );
    await queryRunner.query(`DROP TABLE \`parents\``);
    await queryRunner.query(`DROP TABLE \`level_progresses\``);
    await queryRunner.query(`DROP TABLE \`levels\``);
    await queryRunner.query(`DROP TABLE \`stories\``);
  }
}
