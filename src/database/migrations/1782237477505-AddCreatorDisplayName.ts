import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatorDisplayName1782237477505 implements MigrationInterface {
  name = 'AddCreatorDisplayName1782237477505';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creator_profiles" ADD "displayName" character varying(100) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "creator_profiles" DROP COLUMN "displayName"`,
    );
  }
}
