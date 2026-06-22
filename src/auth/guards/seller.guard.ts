import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { REQUIRE_SELLER_KEY } from '../../common/decorators/require-seller.decorator';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';

/**
 * Authorizes SELLER actions by capability: the authenticated user must have a
 * CreatorProfile (i.e. `isSeller`). Admins bypass. Active mode is irrelevant —
 * authorization never trusts the client's mode.
 * Spec: docs/MotionMesh_Identity_and_ModeSwitching_Spec_v1_0.md §7
 */
@Injectable()
export class SellerGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isSellerRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SELLER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isSellerRequired) {
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
