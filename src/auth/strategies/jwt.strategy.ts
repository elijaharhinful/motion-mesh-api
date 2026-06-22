import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../users/entities/user.entity';
import { UserActions } from '../../users/actions/user.actions';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userActions: UserActions,
  ) {
    const secret = configService.get<string>('JWT_SECRET') ?? '';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          // Extract from HttpOnly cookie first, then Authorization: Bearer header
          const cookies = (
            req as unknown as { cookies?: Record<string, string> }
          ).cookies;
          const cookieToken = cookies?.['access_token'];
          if (typeof cookieToken === 'string' && cookieToken.length > 0) {
            return cookieToken;
          }
          const authHeader = req.headers?.authorization;
          if (
            typeof authHeader === 'string' &&
            authHeader.startsWith('Bearer ')
          ) {
            return authHeader.slice('Bearer '.length);
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userActions.findByIdWithCreatorProfile(payload.sub);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }
}
