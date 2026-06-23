import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DanceVideo } from './entities/dance-video.entity';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { DanceVideoActions } from './actions/dance-video.actions';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([DanceVideo]), StorageModule],
  controllers: [VideosController],
  providers: [VideosService, DanceVideoActions],
  // Export DanceVideoActions so Payments reads video data via the actions layer.
  exports: [VideosService, DanceVideoActions],
})
export class VideosModule {}
