import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constant';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;
const REDIS_REFRESH_PREFIX = 'refresh:';

@Injectable()
export class AuthService {
  private readonly redis: Redis;
  private readonly refreshTtlSeconds: number;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });

    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    // Convert '7d' → seconds
    this.refreshTtlSeconds = this.parseDurationSeconds(refreshExpires);
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.AUTH_EMAIL_TAKEN);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.usersRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    await this.usersRepository.save(user);

    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
      select: [
        'id',
        'email',
        'passwordHash',
        'role',
        'isEmailVerified',
        'firstName',
        'lastName',
        'avatarUrl',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS);
    }

    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
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

    const user = await this.usersRepository.findOne({ where: { id: userId } });
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

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
