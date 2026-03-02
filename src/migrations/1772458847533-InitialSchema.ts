import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1772458847533 implements MigrationInterface {
    name = 'InitialSchema1772458847533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'creator', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "passwordHash" character varying, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "isEmailVerified" boolean NOT NULL DEFAULT false, "googleId" character varying, "avatarUrl" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "creator_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "bio" text, "stripeConnectAccountId" character varying, "isVerified" boolean NOT NULL DEFAULT false, "socialLink" character varying, CONSTRAINT "REL_666d6a0fef932ec2c5fea7dff8" UNIQUE ("userId"), CONSTRAINT "PK_5f58900809b867a2683b6e0e94a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."purchases_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "purchases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "videoId" uuid NOT NULL, "stripePaymentIntentId" character varying NOT NULL, "amountCents" integer NOT NULL, "platformFeeCents" integer NOT NULL, "creatorPayoutCents" integer NOT NULL, "status" "public"."purchases_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "UQ_97bf8f5a08a2f158046195d40fe" UNIQUE ("stripePaymentIntentId"), CONSTRAINT "PK_1d55032f37a34c6eceacbbca6b8" PRIMARY KEY ("id")); COMMENT ON COLUMN "purchases"."amountCents" IS 'Total amount paid in cents'; COMMENT ON COLUMN "purchases"."platformFeeCents" IS '30% platform fee in cents'; COMMENT ON COLUMN "purchases"."creatorPayoutCents" IS '70% creator payout in cents'`);
        await queryRunner.query(`CREATE TYPE "public"."dance_videos_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced')`);
        await queryRunner.query(`CREATE TYPE "public"."dance_videos_category_enum" AS ENUM('hip-hop', 'afrobeats', 'pop', 'latin', 'contemporary', 'ballet', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."dance_videos_status_enum" AS ENUM('draft', 'processing', 'published', 'archived')`);
        await queryRunner.query(`CREATE TABLE "dance_videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "creatorId" uuid NOT NULL, "title" character varying(200) NOT NULL, "description" text, "difficulty" "public"."dance_videos_difficulty_enum" NOT NULL DEFAULT 'beginner', "category" "public"."dance_videos_category_enum" NOT NULL DEFAULT 'other', "priceCents" integer NOT NULL, "status" "public"."dance_videos_status_enum" NOT NULL DEFAULT 'draft', "originalS3Key" character varying, "previewS3Key" character varying, "thumbnailS3Key" character varying, "durationSeconds" integer, CONSTRAINT "PK_fa4b71b7ca8a1aa4d2721669df9" PRIMARY KEY ("id")); COMMENT ON COLUMN "dance_videos"."priceCents" IS 'Price in cents (USD)'; COMMENT ON COLUMN "dance_videos"."durationSeconds" IS 'Duration in seconds (max 60)'`);
        await queryRunner.query(`CREATE TYPE "public"."generation_jobs_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "generation_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "purchaseId" uuid NOT NULL, "klingTaskId" character varying, "facePhotoS3Key" character varying NOT NULL, "resultVideoS3Key" character varying, "resultVideoUrl" character varying, "status" "public"."generation_jobs_status_enum" NOT NULL DEFAULT 'pending', "errorMessage" text, CONSTRAINT "PK_6b6b705e0fed45c8440c1d7d637" PRIMARY KEY ("id")); COMMENT ON COLUMN "generation_jobs"."facePhotoS3Key" IS 'S3 key of the face photo uploaded by the user'; COMMENT ON COLUMN "generation_jobs"."resultVideoS3Key" IS 'S3 key of the final generated video'; COMMENT ON COLUMN "generation_jobs"."errorMessage" IS 'Error message if job failed'`);
        await queryRunner.query(`ALTER TABLE "creator_profiles" ADD CONSTRAINT "FK_666d6a0fef932ec2c5fea7dff82" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_341f0dbe584866284359f30f3da" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_929ab5172dfd701b35313262203" FOREIGN KEY ("videoId") REFERENCES "dance_videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dance_videos" ADD CONSTRAINT "FK_cd9034c0d0900e523cfb2fdc545" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "generation_jobs" ADD CONSTRAINT "FK_ba90990bf28988b3d60aea654df" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "generation_jobs" ADD CONSTRAINT "FK_f1537fb752492e80f45b7e40b4e" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "generation_jobs" DROP CONSTRAINT "FK_f1537fb752492e80f45b7e40b4e"`);
        await queryRunner.query(`ALTER TABLE "generation_jobs" DROP CONSTRAINT "FK_ba90990bf28988b3d60aea654df"`);
        await queryRunner.query(`ALTER TABLE "dance_videos" DROP CONSTRAINT "FK_cd9034c0d0900e523cfb2fdc545"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_929ab5172dfd701b35313262203"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_341f0dbe584866284359f30f3da"`);
        await queryRunner.query(`ALTER TABLE "creator_profiles" DROP CONSTRAINT "FK_666d6a0fef932ec2c5fea7dff82"`);
        await queryRunner.query(`DROP TABLE "generation_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."generation_jobs_status_enum"`);
        await queryRunner.query(`DROP TABLE "dance_videos"`);
        await queryRunner.query(`DROP TYPE "public"."dance_videos_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."dance_videos_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."dance_videos_difficulty_enum"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`DROP TYPE "public"."purchases_status_enum"`);
        await queryRunner.query(`DROP TABLE "creator_profiles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
