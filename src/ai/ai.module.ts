import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { GenerationJob } from './entities/generation-job.entity';
import { Purchase } from '../payments/entities/purchase.entity';
import { AiController } from './ai.controller';
import { AiService, AI_QUEUE } from './ai.service';
import { AiProcessor } from './ai.processor';
import { KlingAiClient } from './kling-ai.client';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GenerationJob, Purchase]),
    BullModule.registerQueue({ name: AI_QUEUE }),
    StorageModule,
    NotificationsModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiProcessor, KlingAiClient],
  exports: [AiService],
})
export class AiModule {}
