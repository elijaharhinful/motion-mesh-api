import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '.env',
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    API_PREFIX: Joi.string().default('api/v1'),

    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),

    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().required(),

    JWT_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

    STORAGE_PROVIDER: Joi.string().valid('minio', 's3').default('minio'),
    S3_ENDPOINT: Joi.string().optional(),
    S3_REGION: Joi.string().required(),
    S3_ACCESS_KEY: Joi.string().required(),
    S3_SECRET_KEY: Joi.string().required(),
    S3_BUCKET_VIDEOS: Joi.string().required(),
    S3_BUCKET_GENERATIONS: Joi.string().required(),
    S3_PRESIGNED_URL_TTL_SECONDS: Joi.number().default(1800),

    STRIPE_SECRET_KEY: Joi.string().required(),
    STRIPE_WEBHOOK_SECRET: Joi.string().required(),
    PLATFORM_COMMISSION_PERCENT: Joi.number().default(30),

    KLING_API_KEY: Joi.string().required(),
    KLING_API_BASE_URL: Joi.string().required(),

    SMTP_HOST: Joi.string().required(),
    SMTP_PORT: Joi.number().default(587),
    SMTP_USER: Joi.string().required(),
    SMTP_PASS: Joi.string().required(),
    EMAIL_FROM: Joi.string().required(),

    FRONTEND_URL: Joi.string().required(),
    VIDEO_RETENTION_DAYS: Joi.number().default(90),
  }),
};
