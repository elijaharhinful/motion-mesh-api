import { Injectable, NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { User } from './entities/user.entity';
import { ActiveMode } from './enums/active-mode.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserActions } from './actions/user.actions';

@Injectable()
export class UsersService {
  constructor(private readonly userActions: UserActions) {}

  async getMe(userId: string): Promise<User> {
    const user = await this.userActions.findByIdWithCreatorProfile(userId);
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.userActions.findById(userId);
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);

    Object.assign(user, dto);
    return this.userActions.save(user);
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
}
