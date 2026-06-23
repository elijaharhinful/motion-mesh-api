import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { User } from '../users/entities/user.entity';
import { CreatorProfile } from './entities/creator-profile.entity';
import { CreatorProfileActions } from './actions/creator-profile.actions';
import { ApplyCreatorDto } from './dto/apply-creator.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';

@Injectable()
export class CreatorsService {
  constructor(private readonly creatorActions: CreatorProfileActions) {}

  async apply(user: User, dto: ApplyCreatorDto): Promise<CreatorProfile> {
    const existing = await this.creatorActions.findByUserId(user.id);
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.CREATOR_ALREADY_APPLIED);
    }

    const profile = this.creatorActions.create({
      userId: user.id,
      displayName: dto.displayName,
      bio: dto.bio ?? null,
      socialLink: dto.socialLink ?? null,
    });
    return this.creatorActions.save(profile);
  }

  async getProfileById(creatorId: string): Promise<CreatorProfile> {
    const profile = await this.creatorActions.findByIdWithUser(creatorId);
    if (!profile) {
      throw new NotFoundException(ERROR_MESSAGES.CREATOR_PROFILE_NOT_FOUND);
    }
    return profile;
  }

  async getMyProfile(userId: string): Promise<CreatorProfile> {
    const profile = await this.creatorActions.findByUserIdWithUser(userId);
    if (!profile) {
      throw new NotFoundException(ERROR_MESSAGES.CREATOR_PROFILE_NOT_FOUND);
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateCreatorProfileDto,
  ): Promise<CreatorProfile> {
    const profile = await this.creatorActions.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException(ERROR_MESSAGES.CREATOR_PROFILE_NOT_FOUND);
    }

    Object.assign(profile, dto);
    return this.creatorActions.save(profile);
  }

  async listCreators(): Promise<CreatorProfile[]> {
    return this.creatorActions.findVerifiedWithUser();
  }

  async assertCreatorOwnsProfile(
    userId: string,
    creatorId: string,
  ): Promise<void> {
    const profile = await this.creatorActions.findOwned(creatorId, userId);
    if (!profile) {
      throw new ForbiddenException(ERROR_MESSAGES.CREATOR_FORBIDDEN);
    }
  }
}
