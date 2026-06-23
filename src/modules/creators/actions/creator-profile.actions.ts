import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CreatorProfile } from '../entities/creator-profile.entity';

/** Data-access layer for CreatorProfile. All DB access for creators lives here. */
@Injectable()
export class CreatorProfileActions {
  constructor(
    @InjectRepository(CreatorProfile)
    private readonly repo: Repository<CreatorProfile>,
  ) {}

  findByUserId(userId: string): Promise<CreatorProfile | null> {
    return this.repo.findOne({ where: { userId } });
  }

  findByUserIdWithUser(userId: string): Promise<CreatorProfile | null> {
    return this.repo.findOne({ where: { userId }, relations: { user: true } });
  }

  findByIdWithUser(id: string): Promise<CreatorProfile | null> {
    return this.repo.findOne({ where: { id }, relations: { user: true } });
  }

  findVerifiedWithUser(): Promise<CreatorProfile[]> {
    return this.repo.find({
      where: { isVerified: true },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  findOwned(id: string, userId: string): Promise<CreatorProfile | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  create(data: DeepPartial<CreatorProfile>): CreatorProfile {
    return this.repo.create(data);
  }

  save(profile: CreatorProfile): Promise<CreatorProfile> {
    return this.repo.save(profile);
  }
}
