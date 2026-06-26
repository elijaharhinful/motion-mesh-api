import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { StorageService } from '../storage/storage.service';
import { STORAGE_PREFIX } from '../storage/storage.constants';
import { DanceVideo } from './entities/dance-video.entity';
import { VideoStatus } from './enums/video-status.enum';
import { DanceVideoActions } from './actions/dance-video.actions';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ListVideosDto } from './dto/list-videos.dto';
import { PublicVideoView, SellerVideoView } from './dto/video-views';

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
    const key = `${STORAGE_PREFIX.videos}/${fileType}/${video.id}/${Date.now()}`;
    const url = await this.storageService.getPresignedUploadUrl(
      this.bucket,
      key,
      contentType,
    );

    // Persist the key so the asset is wired to the listing once the browser's
    // direct-to-S3 PUT completes.
    if (fileType === 'original') video.originalS3Key = key;
    if (fileType === 'preview') video.previewS3Key = key;
    if (fileType === 'thumbnail') video.thumbnailS3Key = key;
    await this.videoActions.save(video);

    return { url, key };
  }

  async publishVideo(
    videoId: string,
    creatorId: string,
  ): Promise<SellerVideoView> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    if (!video.originalS3Key) {
      throw new BadRequestException(ERROR_MESSAGES.VIDEO_NO_ORIGINAL);
    }
    video.status = VideoStatus.PUBLISHED;
    const saved = await this.videoActions.save(video);
    return this.toSellerView(saved);
  }

  async unpublishVideo(
    videoId: string,
    creatorId: string,
  ): Promise<SellerVideoView> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    video.status = VideoStatus.DRAFT;
    const saved = await this.videoActions.save(video);
    return this.toSellerView(saved);
  }

  /** Public marketplace listing — signed thumbnails only, originals never exposed. */
  async list(filters: ListVideosDto): Promise<PublicVideoView[]> {
    const videos = await this.videoActions.listPublished(filters);
    return Promise.all(videos.map((v) => this.toPublicView(v, false)));
  }

  /** Public detail view of a published video — includes a signed preview URL. */
  async getById(videoId: string): Promise<PublicVideoView> {
    const video = await this.videoActions.findByIdWithCreatorAndUser(videoId);
    if (!video) throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    if (video.status !== VideoStatus.PUBLISHED) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_PUBLISHED);
    }
    return this.toPublicView(video, true);
  }

  /** A seller's own listings (any status) for the dashboard. */
  async listMine(creatorId: string): Promise<SellerVideoView[]> {
    const videos = await this.videoActions.findByCreator(creatorId);
    return Promise.all(videos.map((v) => this.toSellerView(v)));
  }

  async update(
    videoId: string,
    creatorId: string,
    dto: UpdateVideoDto,
  ): Promise<SellerVideoView> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    Object.assign(video, dto);
    const saved = await this.videoActions.save(video);
    return this.toSellerView(saved);
  }

  async delete(videoId: string, creatorId: string): Promise<void> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    await this.videoActions.remove(video);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private get bucket(): string {
    return this.configService.get<string>('S3_BUCKET') ?? '';
  }

  private async signKey(key: string | null): Promise<string | null> {
    if (!key) return null;
    return this.storageService.getPresignedDownloadUrl(this.bucket, key);
  }

  private async toPublicView(
    video: DanceVideo,
    includePreview: boolean,
  ): Promise<PublicVideoView> {
    const [thumbnailUrl, previewUrl] = await Promise.all([
      this.signKey(video.thumbnailS3Key),
      includePreview ? this.signKey(video.previewS3Key) : Promise.resolve(null),
    ]);

    return {
      id: video.id,
      creatorId: video.creatorId,
      title: video.title,
      description: video.description,
      difficulty: video.difficulty,
      category: video.category,
      priceCents: video.priceCents,
      status: video.status,
      durationSeconds: video.durationSeconds,
      thumbnailUrl,
      previewUrl,
      creator: video.creator
        ? {
            id: video.creator.id,
            displayName: video.creator.displayName,
            isVerified: video.creator.isVerified,
            avatarUrl: video.creator.user?.avatarUrl ?? null,
          }
        : null,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }

  private async toSellerView(video: DanceVideo): Promise<SellerVideoView> {
    const [thumbnailUrl, previewUrl] = await Promise.all([
      this.signKey(video.thumbnailS3Key),
      this.signKey(video.previewS3Key),
    ]);

    return {
      id: video.id,
      creatorId: video.creatorId,
      title: video.title,
      description: video.description,
      difficulty: video.difficulty,
      category: video.category,
      priceCents: video.priceCents,
      status: video.status,
      durationSeconds: video.durationSeconds,
      thumbnailUrl,
      previewUrl,
      hasOriginal: !!video.originalS3Key,
      hasPreview: !!video.previewS3Key,
      hasThumbnail: !!video.thumbnailS3Key,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }

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
