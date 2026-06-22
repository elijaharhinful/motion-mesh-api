import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constant';
import { StorageService } from '../storage/storage.service';
import { DanceVideo } from './entities/dance-video.entity';
import { VideoStatus } from './enums/video-status.enum';
import { DanceVideoActions } from './actions/dance-video.actions';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ListVideosDto } from './dto/list-videos.dto';

@Injectable()
export class VideosService {
  constructor(
    private readonly videoActions: DanceVideoActions,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async create(creatorId: string, dto: CreateVideoDto): Promise<DanceVideo> {
    const video = this.videoActions.create({
      creatorId,
      title: dto.title,
      description: dto.description ?? null,
      difficulty: dto.difficulty,
      category: dto.category,
      priceCents: dto.priceCents,
    });
    return this.videoActions.save(video);
  }

  async getPresignedUploadUrl(
    videoId: string,
    creatorId: string,
    fileType: 'original' | 'preview' | 'thumbnail',
    contentType: string,
  ): Promise<{ url: string; key: string }> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    const bucket = this.configService.get<string>('S3_BUCKET_VIDEOS') ?? '';
    const key = `${fileType}/${video.id}/${Date.now()}`;
    const url = await this.storageService.getPresignedUploadUrl(
      bucket,
      key,
      contentType,
    );
    return { url, key };
  }

  async publishVideo(videoId: string, creatorId: string): Promise<DanceVideo> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    video.status = VideoStatus.PUBLISHED;
    return this.videoActions.save(video);
  }

  async list(filters: ListVideosDto): Promise<DanceVideo[]> {
    return this.videoActions.listPublished(filters);
  }

  async getById(videoId: string): Promise<DanceVideo> {
    const video = await this.videoActions.findByIdWithCreatorAndUser(videoId);
    if (!video) throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    return video;
  }

  async update(
    videoId: string,
    creatorId: string,
    dto: UpdateVideoDto,
  ): Promise<DanceVideo> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    Object.assign(video, dto);
    return this.videoActions.save(video);
  }

  async delete(videoId: string, creatorId: string): Promise<void> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    await this.videoActions.remove(video);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async findOwnedByCreator(
    videoId: string,
    creatorId: string,
  ): Promise<DanceVideo> {
    const video = await this.videoActions.findById(videoId);
    if (!video) throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    if (video.creatorId !== creatorId) {
      throw new ForbiddenException(ERROR_MESSAGES.VIDEO_FORBIDDEN);
    }
    return video;
  }
}
