import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { DanceVideo } from '../entities/dance-video.entity';
import { VideoStatus } from '../enums/video-status.enum';
import { ListVideosDto } from '../dto/list-videos.dto';

/** Data-access layer for DanceVideo. All DB access for videos lives here. */
@Injectable()
export class DanceVideoActions {
  constructor(
    @InjectRepository(DanceVideo)
    private readonly repo: Repository<DanceVideo>,
  ) {}

  findById(id: string): Promise<DanceVideo | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByIdWithCreatorAndUser(id: string): Promise<DanceVideo | null> {
    return this.repo.findOne({
      where: { id },
      relations: { creator: { user: true } },
    });
  }

  findByIdWithCreator(id: string): Promise<DanceVideo | null> {
    return this.repo.findOne({ where: { id }, relations: { creator: true } });
  }

  /** Published-catalogue listing with optional filters (parameterised query builder). */
  listPublished(filters: ListVideosDto): Promise<DanceVideo[]> {
    const qb = this.repo
      .createQueryBuilder('video')
      .leftJoinAndSelect('video.creator', 'creator')
      .leftJoinAndSelect('creator.user', 'user')
      .where('video.status = :status', { status: VideoStatus.PUBLISHED });

    if (filters.category) {
      qb.andWhere('video.category = :category', { category: filters.category });
    }
    if (filters.difficulty) {
      qb.andWhere('video.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }
    if (filters.minPriceCents !== undefined) {
      qb.andWhere('video.priceCents >= :min', { min: filters.minPriceCents });
    }
    if (filters.maxPriceCents !== undefined) {
      qb.andWhere('video.priceCents <= :max', { max: filters.maxPriceCents });
    }

    return qb.orderBy('video.createdAt', 'DESC').getMany();
  }

  create(data: DeepPartial<DanceVideo>): DanceVideo {
    return this.repo.create(data);
  }

  save(video: DanceVideo): Promise<DanceVideo> {
    return this.repo.save(video);
  }

  remove(video: DanceVideo): Promise<DanceVideo> {
    return this.repo.remove(video);
  }
}
