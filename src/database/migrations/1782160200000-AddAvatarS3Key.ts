import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarS3Key1782160200000 implements MigrationInterface {
  name = 'AddAvatarS3Key1782160200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatarS3Key" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarS3Key"`);
  }
}
