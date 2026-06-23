import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatorProfile } from './entities/creator-profile.entity';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { CreatorProfileActions } from './actions/creator-profile.actions';

@Module({
  imports: [TypeOrmModule.forFeature([CreatorProfile])],
  controllers: [CreatorsController],
  providers: [CreatorsService, CreatorProfileActions],
  exports: [CreatorsService, CreatorProfileActions],
})
export class CreatorsModule {}
