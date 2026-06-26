import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserActions } from './actions/user.actions';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), StorageModule],
  controllers: [UsersController],
  providers: [UsersService, UserActions],
  // Export UserActions so Auth/Creators access user data via the actions layer
  // instead of injecting the repository directly.
  exports: [UsersService, UserActions],
})
export class UsersModule {}
