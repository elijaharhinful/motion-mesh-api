import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AiService } from './ai.service';
import { TriggerGenerationDto } from './dto/trigger-generation.dto';
import { FacePhotoUploadDto } from './dto/face-photo-upload.dto';
import {
  ApiTriggerGeneration,
  ApiGetJobStatus,
  ApiGetFacePhotoUploadUrl,
  ApiGetResultDownloadUrl,
} from './swagger/ai.swagger';
import {
  SUCCESS_MESSAGES,
  fetchSuccess,
} from '../../common/constants/success-messages.constant';

@ApiTags('AI Generation')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('face-photo/presigned-url')
  @ApiGetFacePhotoUploadUrl()
  async getFacePhotoUploadUrl(
    @CurrentUser() user: User,
    @Body() dto: FacePhotoUploadDto,
  ) {
    const data = await this.aiService.getFacePhotoUploadUrl(
      user.id,
      dto.contentType,
    );
    return { _message: SUCCESS_MESSAGES.PRESIGNED_URL_CREATED, data };
  }

  @Post('generate')
  @ApiTriggerGeneration()
  async triggerGeneration(
    @CurrentUser() user: User,
    @Body() dto: TriggerGenerationDto,
  ) {
    const data = await this.aiService.triggerGeneration(user.id, dto);
    return { _message: SUCCESS_MESSAGES.GENERATION_QUEUED, data };
  }

  @Get('jobs/:id')
  @ApiGetJobStatus()
  async getJobStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.aiService.getJobStatus(id, user.id);
    return { _message: fetchSuccess('generation job'), data };
  }

  @Get('jobs/:id/download-url')
  @ApiGetResultDownloadUrl()
  async getResultDownloadUrl(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.aiService.getResultDownloadUrl(id, user.id);
    return { _message: SUCCESS_MESSAGES.DOWNLOAD_URL_CREATED, data };
  }
}
