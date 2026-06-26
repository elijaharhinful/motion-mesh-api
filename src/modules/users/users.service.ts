import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { StorageService } from '../storage/storage.service';
import { STORAGE_PREFIX } from '../storage/storage.constants';
import { User } from './entities/user.entity';
import { ActiveMode } from './enums/active-mode.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserActions } from './actions/user.actions';

@Injectable()
export class UsersService {
  constructor(
    private readonly userActions: UserActions,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async getMe(userId: string): Promise<User> {
    const user = await this.userActions.findByIdWithCreatorProfile(userId);
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    return this.withSignedAvatar(user);
  }

  /**
   * Mints a presigned PUT URL so the browser can upload an avatar directly to
   * storage. The returned `key` is sent back via PATCH /users/me to persist it.
   */
  async getAvatarUploadUrl(
    userId: string,
    contentType: string,
  ): Promise<{ url: string; key: string }> {
    const user = await this.userActions.findById(userId);
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);

    const bucket = this.configService.get<string>('S3_BUCKET') ?? '';
    const key = `${STORAGE_PREFIX.avatars}/${userId}/${Date.now()}`;
    const url = await this.storageService.getPresignedUploadUrl(
      bucket,
      key,
      contentType,
    );
    return { url, key };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userActions.findById(userId);
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);

    const previousAvatarKey = user.avatarS3Key;
    Object.assign(user, dto);
    await this.userActions.save(user);

    // Best-effort cleanup of the replaced avatar object.
    if (
      dto.avatarS3Key &&
      previousAvatarKey &&
      previousAvatarKey !== dto.avatarS3Key
    ) {
      const bucket = this.configService.get<string>('S3_BUCKET') ?? '';
      await this.storageService.deleteObject(bucket, previousAvatarKey);
    }

    // Reload with creatorProfile so the response carries isSeller + signed avatar.
    return this.getMe(userId);
  }

  /** Persists the user's last active workspace (UI preference, not authz). */
  async updateActiveMode(userId: string, mode: ActiveMode): Promise<User> {
    const user = await this.userActions.findById(userId);
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);

    user.lastActiveMode = mode;
    await this.userActions.save(user);
    // Reload with creatorProfile so the response carries an accurate isSeller.
    return this.getMe(userId);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userActions.findById(userId);
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    await this.userActions.remove(user);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * When the user has a self-uploaded avatar, replace `avatarUrl` with a signed,
   * time-limited GET URL so the private object can be displayed. External
   * avatars (e.g. Google) are left untouched.
   */
  private async withSignedAvatar(user: User): Promise<User> {
    if (!user.avatarS3Key) return user;
    const bucket = this.configService.get<string>('S3_BUCKET') ?? '';
    user.avatarUrl = await this.storageService.getPresignedDownloadUrl(
      bucket,
      user.avatarS3Key,
    );
    return user;
  }
}
