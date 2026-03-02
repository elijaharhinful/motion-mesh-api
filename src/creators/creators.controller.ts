import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreatorsService } from './creators.service';
import { ApplyCreatorDto } from './dto/apply-creator.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import {
  ApiApplyCreator,
  ApiGetCreator,
  ApiGetMyCreatorProfile,
  ApiListCreators,
  ApiUpdateCreatorProfile,
} from './swagger/creators.swagger';
import {
  SUCCESS_MESSAGES,
  fetchSuccess,
} from '../common/constants/success-messages.constant';

@ApiTags('Creators')
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiApplyCreator()
  async apply(@CurrentUser() user: User, @Body() dto: ApplyCreatorDto) {
    const data = await this.creatorsService.apply(user, dto);
    return { _message: SUCCESS_MESSAGES.CREATOR_PROFILE_UPDATED, data };
  }

  @Get()
  @ApiListCreators()
  async listCreators() {
    const data = await this.creatorsService.listCreators();
    return { _message: fetchSuccess('creators'), data };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiGetMyCreatorProfile()
  async getMyProfile(@CurrentUser() user: User) {
    const data = await this.creatorsService.getMyProfile(user.id);
    return { _message: fetchSuccess('creator profile'), data };
  }

  @Get(':id')
  @ApiGetCreator()
  async getProfile(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.creatorsService.getProfileById(id);
    return { _message: fetchSuccess('creator profile'), data };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateCreatorProfile()
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateCreatorProfileDto,
  ) {
    const data = await this.creatorsService.updateProfile(user.id, dto);
    return { _message: SUCCESS_MESSAGES.CREATOR_PROFILE_UPDATED, data };
  }
}
