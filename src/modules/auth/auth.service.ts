import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { User } from '../users/entities/user.entity';
import { UserActions } from '../users/actions/user.actions';
import { NotificationsService } from '../notifications/notifications.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { Profile as GoogleProfile } from 'passport-google-oauth20';

const BCRYPT_ROUNDS = 12;
const REDIS_REFRESH_PREFIX = 'refresh:';
const REDIS_VERIFY_PREFIX = 'verify:';
const REDIS_RESET_PREFIX = 'reset:';
const VERIFY_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const RESET_TTL_SECONDS = 60 * 60; // 1 hour

@Injectable()
export class AuthService {
  private readonly redis: Redis;
  private readonly refreshTtlSeconds: number;
  private readonly frontendUrl: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userActions: UserActions,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
    });

    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    // Convert '7d' → seconds
    this.refreshTtlSeconds = this.parseDurationSeconds(refreshExpires);
  }

  /**
   * Registers a new account but does NOT log the user in — they must verify
   * their email first (see `verifyEmail`). A verification link is emailed.
   */
  async register(dto: RegisterDto): Promise<{ user: User }> {
    const existing = await this.userActions.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.AUTH_EMAIL_TAKEN);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userActions.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    const saved = await this.userActions.save(user);

    await this.sendVerificationEmail(saved);
    return { user: saved };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.userActions.findForAuth(dto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS);
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH_EMAIL_NOT_VERIFIED);
    }

    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  /** Confirms an email address using the token from the verification link. */
  async verifyEmail(token: string): Promise<User> {
    const userId = await this.consumeToken(REDIS_VERIFY_PREFIX, token);
    if (!userId) {
      throw new BadRequestException(
        ERROR_MESSAGES.AUTH_INVALID_VERIFICATION_TOKEN,
      );
    }

    const user = await this.userActions.findById(userId);
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    user.isEmailVerified = true;
    return this.userActions.save(user);
  }

  /** Re-sends a verification link. Always resolves (no account enumeration). */
  async resendVerification(email: string): Promise<void> {
    const user = await this.userActions.findByEmail(email);
    if (user && !user.isEmailVerified) {
      await this.sendVerificationEmail(user);
    }
  }

  /** Starts a password reset. Always resolves (no account enumeration). */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userActions.findByEmail(email);
    if (!user) return;

    const token = await this.createToken(
      REDIS_RESET_PREFIX,
      user.id,
      RESET_TTL_SECONDS,
    );
    const url = `${this.frontendUrl}/reset-password?token=${token}`;
    this.logDevLink('Password reset', user.email, url);
    await this.notificationsService.sendPasswordResetEmail(user.email, url);
  }

  /** Completes a password reset using the token from the reset link. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.consumeToken(REDIS_RESET_PREFIX, token);
    if (!userId) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH_INVALID_RESET_TOKEN);
    }

    const user = await this.userActions.findById(userId);
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userActions.save(user);
  }

  async refresh(
    opaqueToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const key = `${REDIS_REFRESH_PREFIX}${opaqueToken}`;
    const userId = await this.redis.get(key);

    if (!userId) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH_INVALID_REFRESH_TOKEN,
      );
    }

    const user = await this.userActions.findById(userId);
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Rotate: delete old token and issue new pair
    await this.redis.del(key);
    return this.issueTokens(user);
  }

  async logout(opaqueToken: string): Promise<void> {
    await this.redis.del(`${REDIS_REFRESH_PREFIX}${opaqueToken}`);
  }

  async googleOAuth(
    profile: GoogleProfile,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName ?? 'Google';
    const lastName = profile.name?.familyName ?? 'User';
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    if (!email) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH_GOOGLE_NO_EMAIL);
    }

    // 1. Try to find an existing user by googleId (creatorProfile loaded for isSeller)
    let user = await this.userActions.findByGoogleId(googleId);

    if (!user) {
      // 2. Fall back to email lookup — may be a pre-existing password account
      user = await this.userActions.findByEmailWithCreatorProfile(email);

      if (user) {
        // Link the Google identity to the existing account
        user.googleId = googleId;
        if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
        user.isEmailVerified = true;
        await this.userActions.save(user);
      } else {
        // 3. Brand-new user — create from Google profile (Google already verified email)
        user = this.userActions.create({
          email,
          firstName,
          lastName,
          googleId,
          avatarUrl,
          passwordHash: null,
          isEmailVerified: true,
        });
        await this.userActions.save(user);
      }
    }

    return { user, ...(await this.issueTokens(user)) };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = await this.createToken(
      REDIS_VERIFY_PREFIX,
      user.id,
      VERIFY_TTL_SECONDS,
    );
    const url = `${this.frontendUrl}/verify-email?token=${token}`;
    this.logDevLink('Verification', user.email, url);
    await this.notificationsService.sendVerificationEmail(user.email, url);
  }

  private async createToken(
    prefix: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(`${prefix}${token}`, userId, 'EX', ttlSeconds);
    return token;
  }

  /** Reads and deletes a single-use token, returning the associated userId. */
  private async consumeToken(
    prefix: string,
    token: string,
  ): Promise<string | null> {
    const key = `${prefix}${token}`;
    const userId = await this.redis.get(key);
    if (userId) {
      await this.redis.del(key);
    }
    return userId;
  }

  /** Logs the email link to the server console outside production, to ease testing. */
  private logDevLink(kind: string, email: string, url: string): void {
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      this.logger.log(`[dev] ${kind} link for ${email}: ${url}`);
    }
  }

  /** Converts a duration string (e.g. '7d', '24h', '30m', '60s') to seconds. */
  private parseDurationSeconds(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) {
      throw new Error(
        `Invalid duration format: "${duration}". Expected e.g. '7d', '24h', '30m', '60s'.`,
      );
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Unsupported time unit: "${unit}"`);
    }
  }

  private async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = randomBytes(40).toString('hex');
    await this.redis.set(
      `${REDIS_REFRESH_PREFIX}${refreshToken}`,
      user.id,
      'EX',
      this.refreshTtlSeconds,
    );

    return { accessToken, refreshToken };
  }
}
