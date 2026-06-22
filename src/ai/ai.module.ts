import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { GenerationJob } from './entities/generation-job.entity';
import { AiController } from './ai.controller';
import { AiService, AI_QUEUE } from './ai.service';
import { AiProcessor } from './ai.processor';
import { GenerationJobActions } from './actions/generation-job.actions';
import { KlingAiClient } from './kling-ai.client';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GenerationJob]),
    BullModule.registerQueue({ name: AI_QUEUE }),
    StorageModule,
    NotificationsModule,
    PaymentsModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiProcessor, GenerationJobActions, KlingAiClient],
  exports: [AiService],
})
export class AiModule {}
