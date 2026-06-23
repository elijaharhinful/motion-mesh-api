const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockRedis),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UserActions } from '../../users/actions/user.actions';
import { NotificationsService } from '../../notifications/notifications.service';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.MEMBER,
    lastActiveMode: null,
    isEmailVerified: true,
    googleId: null,
    avatarUrl: null,
    creatorProfile: null,
    isSeller: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as User;

describe('AuthService', () => {
  let service: AuthService;
  let userActions: jest.Mocked<UserActions>;
  let notifications: {
    sendVerificationEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    userActions = {
      findByEmail: jest.fn(),
      findByEmailWithCreatorProfile: jest.fn(),
      findForAuth: jest.fn(),
      findById: jest.fn(),
      findByGoogleId: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserActions>;

    notifications = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = { sign: jest.fn().mockReturnValue('access-token') };

    const config: Record<string, unknown> = {
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: '',
      FRONTEND_URL: 'http://localhost:3000',
      JWT_REFRESH_EXPIRES_IN: '7d',
      // 'production' silences the dev-only link logging; no tested behavior depends on it.
      NODE_ENV: 'production',
    };
    const configService = { get: jest.fn((key: string) => config[key]) };

    service = new AuthService(
      userActions,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      notifications as unknown as NotificationsService,
    );
  });

  describe('register', () => {
    const dto = {
      email: 'jane@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('throws Conflict if the email is already taken', async () => {
      userActions.findByEmail.mockResolvedValue(buildUser());
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(userActions.save).not.toHaveBeenCalled();
    });

    it('creates an unverified user, emails a link, and issues NO session', async () => {
      userActions.findByEmail.mockResolvedValue(null);
      const created = buildUser({ isEmailVerified: false });
      userActions.create.mockReturnValue(created);
      userActions.save.mockResolvedValue(created);

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'password123',
        expect.any(Number),
      );
      expect(userActions.save).toHaveBeenCalledWith(created);
      expect(notifications.sendVerificationEmail).toHaveBeenCalledWith(
        created.email,
        expect.stringContaining('/verify-email?token='),
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^verify:/),
        created.id,
        'EX',
        expect.any(Number),
      );
      expect(result).toEqual({ user: created });
      expect(
        (result as unknown as Record<string, unknown>).accessToken,
      ).toBeUndefined();
    });
  });

  describe('login', () => {
    const dto = { email: 'jane@example.com', password: 'password123' };

    it('throws Unauthorized when the user does not exist', async () => {
      userActions.findForAuth.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws Unauthorized on a wrong password', async () => {
      userActions.findForAuth.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws Forbidden when the email is not verified', async () => {
      userActions.findForAuth.mockResolvedValue(
        buildUser({ isEmailVerified: false }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.login(dto)).rejects.toThrow(ForbiddenException);
    });

    it('returns tokens for valid, verified credentials', async () => {
      userActions.findForAuth.mockResolvedValue(
        buildUser({ isEmailVerified: true }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^refresh:/),
        'user-1',
        'EX',
        expect.any(Number),
      );
    });
  });

  describe('verifyEmail', () => {
    it('throws BadRequest for an invalid or expired token', async () => {
      mockRedis.get.mockResolvedValue(null);
      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('marks the user verified and consumes the single-use token', async () => {
      mockRedis.get.mockResolvedValue('user-1');
      const user = buildUser({ isEmailVerified: false });
      userActions.findById.mockResolvedValue(user);
      userActions.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.verifyEmail('good-token');

      expect(result.isEmailVerified).toBe(true);
      expect(userActions.save).toHaveBeenCalledWith(user);
      expect(mockRedis.del).toHaveBeenCalledWith('verify:good-token');
    });
  });

  describe('resendVerification', () => {
    it('does nothing for an unknown email (no enumeration)', async () => {
      userActions.findByEmail.mockResolvedValue(null);
      await service.resendVerification('nobody@example.com');
      expect(notifications.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('does nothing when the account is already verified', async () => {
      userActions.findByEmail.mockResolvedValue(
        buildUser({ isEmailVerified: true }),
      );
      await service.resendVerification('jane@example.com');
      expect(notifications.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('sends a new link for a known unverified account', async () => {
      userActions.findByEmail.mockResolvedValue(
        buildUser({ isEmailVerified: false }),
      );
      await service.resendVerification('jane@example.com');
      expect(notifications.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('forgotPassword', () => {
    it('does nothing for an unknown email (no enumeration)', async () => {
      userActions.findByEmail.mockResolvedValue(null);
      await service.forgotPassword('nobody@example.com');
      expect(notifications.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('emails a reset link for a known account', async () => {
      userActions.findByEmail.mockResolvedValue(buildUser());
      await service.forgotPassword('jane@example.com');
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^reset:/),
        'user-1',
        'EX',
        expect.any(Number),
      );
      expect(notifications.sendPasswordResetEmail).toHaveBeenCalledWith(
        'jane@example.com',
        expect.stringContaining('/reset-password?token='),
      );
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequest for an invalid or expired token', async () => {
      mockRedis.get.mockResolvedValue(null);
      await expect(
        service.resetPassword('bad-token', 'newpassword'),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates the password and consumes the single-use token', async () => {
      mockRedis.get.mockResolvedValue('user-1');
      const user = buildUser();
      userActions.findById.mockResolvedValue(user);
      userActions.save.mockImplementation((u) => Promise.resolve(u));

      await service.resetPassword('good-token', 'brand-new-password');

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'brand-new-password',
        expect.any(Number),
      );
      expect(user.passwordHash).toBe('hashed-password');
      expect(userActions.save).toHaveBeenCalledWith(user);
      expect(mockRedis.del).toHaveBeenCalledWith('reset:good-token');
    });
  });
});
