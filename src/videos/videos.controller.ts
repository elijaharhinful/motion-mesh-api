import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatorProfileGuard } from '../auth/guards/creator-profile.guard';
import { RequireCreatorProfile } from '../common/decorators/require-creator-profile.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ListVideosDto } from './dto/list-videos.dto';
import {
  ApiCreateVideo,
  ApiDeleteVideo,
  ApiGetVideo,
  ApiListVideos,
  ApiPublishVideo,
  ApiUpdateVideo,
  ApiGetVideoPresignedUrl,
} from './swagger/videos.swagger';
import {
  SUCCESS_MESSAGES,
  fetchSuccess,
} from '../common/constants/success-messages.constant';

@ApiTags('Videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, CreatorProfileGuard)
  @RequireCreatorProfile()
  @ApiCreateVideo()
  async create(@CurrentUser() user: User, @Body() dto: CreateVideoDto) {
    // creatorId is the user's creatorProfile.id, resolved from creatorId FK
    const data = await this.videosService.create(
      user.creatorProfile?.id ?? user.id,
      dto,
    );
    return { _message: SUCCESS_MESSAGES.VIDEO_CREATED, data };
  }

  @Get()
  @ApiListVideos()
  async list(@Query() filters: ListVideosDto) {
    const data = await this.videosService.list(filters);
    return { _message: fetchSuccess('videos'), data };
  }

  @Get(':id')
  @ApiGetVideo()
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.videosService.getById(id);
    return { _message: fetchSuccess('video'), data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CreatorProfileGuard)
  @RequireCreatorProfile()
  @ApiUpdateVideo()
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVideoDto,
  ) {
    const data = await this.videosService.update(
      id,
      user.creatorProfile?.id ?? user.id,
      dto,
    );
    return { _message: SUCCESS_MESSAGES.VIDEO_UPDATED, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, CreatorProfileGuard)
  @RequireCreatorProfile()
  @ApiDeleteVideo()
  delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.delete(id, user.creatorProfile?.id ?? user.id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, CreatorProfileGuard)
  @RequireCreatorProfile()
  @ApiPublishVideo()
  async publish(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.videosService.publishVideo(
      id,
      user.creatorProfile?.id ?? user.id,
    );
    return { _message: SUCCESS_MESSAGES.VIDEO_PUBLISHED, data };
  }

  @Post(':id/presigned-url')
  @UseGuards(JwtAuthGuard, CreatorProfileGuard)
  @RequireCreatorProfile()
  @ApiGetVideoPresignedUrl()
  async getPresignedUrl(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      fileType: 'original' | 'preview' | 'thumbnail';
      contentType: string;
    },
  ) {
    const data = await this.videosService.getPresignedUploadUrl(
      id,
      user.creatorProfile?.id ?? user.id,
      body.fileType,
      body.contentType,
    );
    return { _message: SUCCESS_MESSAGES.VIDEO_UPLOADED, data };
  }
}
