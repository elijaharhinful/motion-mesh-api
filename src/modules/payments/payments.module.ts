import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PurchaseActions } from './actions/purchase.actions';
import { VideosModule } from '../videos/videos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase]), VideosModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PurchaseActions],
  // Export PurchaseActions so the AI module reads purchases via the actions layer.
  exports: [PaymentsService, PurchaseActions],
})
export class PaymentsModule {}
