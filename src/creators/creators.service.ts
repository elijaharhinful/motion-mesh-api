import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constant';
import { User, UserRole } from '../users/entities/user.entity';
import { CreatorProfile } from './entities/creator-profile.entity';
import { ApplyCreatorDto } from './dto/apply-creator.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';

@Injectable()
export class CreatorsService {
  constructor(
    @InjectRepository(CreatorProfile)
    private readonly creatorProfilesRepository: Repository<CreatorProfile>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async apply(user: User, dto: ApplyCreatorDto): Promise<CreatorProfile> {
    const existing = await this.creatorProfilesRepository.findOne({
      where: { userId: user.id },
    });
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.CREATOR_ALREADY_APPLIED);
    }

    const profile = this.creatorProfilesRepository.create({
      userId: user.id,
      bio: dto.bio ?? null,
      socialLink: dto.socialLink ?? null,
    });
    const saved = await this.creatorProfilesRepository.save(profile);

    // Upgrade user role to CREATOR
    await this.usersRepository.update(user.id, { role: UserRole.CREATOR });

    return saved;
  }

  async getProfileById(creatorId: string): Promise<CreatorProfile> {
    const profile = await this.creatorProfilesRepository.findOne({
      where: { id: creatorId },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException(ERROR_MESSAGES.CREATOR_PROFILE_NOT_FOUND);
    }
    return profile;
  }

  async getMyProfile(userId: string): Promise<CreatorProfile> {
    const profile = await this.creatorProfilesRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException(ERROR_MESSAGES.CREATOR_PROFILE_NOT_FOUND);
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateCreatorProfileDto,
  ): Promise<CreatorProfile> {
    const profile = await this.creatorProfilesRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(ERROR_MESSAGES.CREATOR_PROFILE_NOT_FOUND);
    }

    Object.assign(profile, dto);
    return this.creatorProfilesRepository.save(profile);
  }

  async listCreators(): Promise<CreatorProfile[]> {
    return this.creatorProfilesRepository.find({
      where: { isVerified: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async assertCreatorOwnsProfile(userId: string, creatorId: string): Promise<void> {
    const profile = await this.creatorProfilesRepository.findOne({
      where: { id: creatorId, userId },
    });
    if (!profile) {
      throw new ForbiddenException(ERROR_MESSAGES.CREATOR_FORBIDDEN);
    }
  }
}
