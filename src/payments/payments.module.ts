import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DanceVideo } from '../videos/entities/dance-video.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, DanceVideo])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
