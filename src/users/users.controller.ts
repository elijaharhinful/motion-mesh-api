import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiGetMe, ApiUpdateMe, ApiDeleteMe } from './swagger/users.swagger';
import {
  SUCCESS_MESSAGES,
  fetchSuccess,
} from '../common/constants/success-messages.constant';

@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiGetMe()
  async getMe(@CurrentUser() user: User) {
    const data = await this.usersService.getMe(user.id);
    return { _message: fetchSuccess('profile'), data };
  }

  @Patch('me')
  @ApiUpdateMe()
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.usersService.updateProfile(user.id, dto);
    return { _message: SUCCESS_MESSAGES.PROFILE_UPDATED, data };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteMe()
  deleteAccount(@CurrentUser() user: User) {
    return this.usersService.deleteAccount(user.id);
  }
}
