import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constant';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { DanceVideo, VideoCategory, VideoDifficulty, VideoStatus } from './entities/dance-video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ListVideosDto } from './dto/list-videos.dto';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(DanceVideo)
    private readonly videosRepository: Repository<DanceVideo>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async create(creatorId: string, dto: CreateVideoDto): Promise<DanceVideo> {
    const video = this.videosRepository.create({
      creatorId,
      title: dto.title,
      description: dto.description ?? null,
      difficulty: dto.difficulty,
      category: dto.category,
      priceCents: dto.priceCents,
    });
    return this.videosRepository.save(video);
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
    const url = await this.storageService.getPresignedUploadUrl(bucket, key, contentType);
    return { url, key };
  }

  async publishVideo(videoId: string, creatorId: string): Promise<DanceVideo> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    video.status = VideoStatus.PUBLISHED;
    return this.videosRepository.save(video);
  }

  async list(filters: ListVideosDto): Promise<DanceVideo[]> {
    const qb = this.videosRepository
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.creator', 'creator')
      .leftJoinAndSelect('creator.user', 'user')
      .where('video.status = :status', { status: VideoStatus.PUBLISHED });

    if (filters.category) {
      qb.andWhere('video.category = :category', { category: filters.category });
    }
    if (filters.difficulty) {
      qb.andWhere('video.difficulty = :difficulty', { difficulty: filters.difficulty });
    }
    if (filters.minPriceCents !== undefined) {
      qb.andWhere('video.priceCents >= :min', { min: filters.minPriceCents });
    }
    if (filters.maxPriceCents !== undefined) {
      qb.andWhere('video.priceCents <= :max', { max: filters.maxPriceCents });
    }

    return qb.orderBy('video.createdAt', 'DESC').getMany();
  }

  async getById(videoId: string): Promise<DanceVideo> {
    const video = await this.videosRepository.findOne({
      where: { id: videoId },
      relations: ['creator', 'creator.user'],
    });
    if (!video) throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    return video;
  }

  async update(videoId: string, creatorId: string, dto: UpdateVideoDto): Promise<DanceVideo> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    Object.assign(video, dto);
    return this.videosRepository.save(video);
  }

  async delete(videoId: string, creatorId: string): Promise<void> {
    const video = await this.findOwnedByCreator(videoId, creatorId);
    await this.videosRepository.remove(video);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async findOwnedByCreator(videoId: string, creatorId: string): Promise<DanceVideo> {
    const video = await this.videosRepository.findOne({ where: { id: videoId } });
    if (!video) throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    if (video.creatorId !== creatorId) {
      throw new ForbiddenException(ERROR_MESSAGES.VIDEO_FORBIDDEN);
    }
    return video;
  }
}
