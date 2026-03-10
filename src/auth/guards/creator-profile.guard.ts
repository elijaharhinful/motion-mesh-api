import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from '../../users/entities/user.entity';
import { REQUIRE_CREATOR_PROFILE_KEY } from '../../common/decorators/require-creator-profile.decorator';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';

@Injectable()
export class CreatorProfileGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isCreatorProfileRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_CREATOR_PROFILE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isCreatorProfileRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (!user.creatorProfile) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    return true;
  }
}
