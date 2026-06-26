import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configModuleOptions } from './config/config.module';
import { dataSourceOptions } from './database/data-source';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CreatorsModule } from './modules/creators/creators.module';
import { VideosModule } from './modules/videos/videos.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StorageModule } from './modules/storage/storage.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    // ─── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot(configModuleOptions),

    // ─── Database ────────────────────────────────────────────────────────────
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),

    // ─── Redis / BullMQ ──────────────────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          // BullMQ requires this to be null for blocking commands.
          maxRetriesPerRequest: null,
          ...(configService.get<boolean>('REDIS_TLS') ? { tls: {} } : {}),
        },
      }),
    }),

    // ─── Feature Modules ─────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    CreatorsModule,
    VideosModule,
    PaymentsModule,
    StorageModule,
    AiModule,
    NotificationsModule,
    WebhooksModule,
  ],
})
export class AppModule {}
