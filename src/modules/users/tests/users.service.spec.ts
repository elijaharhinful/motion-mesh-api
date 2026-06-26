import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users.service';
import { UserActions } from '../actions/user.actions';
import { StorageService } from '../../storage/storage.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { ActiveMode } from '../enums/active-mode.enum';

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.MEMBER,
    lastActiveMode: null,
    isEmailVerified: true,
    googleId: null,
    avatarUrl: null,
    avatarS3Key: null,
    creatorProfile: null,
    isSeller: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as User;

describe('UsersService', () => {
  let service: UsersService;
  let userActions: jest.Mocked<UserActions>;
  let storageService: jest.Mocked<StorageService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    userActions = {
      findById: jest.fn(),
      findByIdWithCreatorProfile: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<UserActions>;

    storageService = {
      getPresignedUploadUrl: jest.fn(),
      getPresignedDownloadUrl: jest.fn(),
      deleteObject: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    configService = {
      get: jest.fn(() => 'motion-mesh'),
    } as unknown as jest.Mocked<ConfigService>;

    service = new UsersService(userActions, storageService, configService);
  });

  describe('getMe', () => {
    it('returns the user with the creatorProfile relation loaded', async () => {
      const user = buildUser();
      userActions.findByIdWithCreatorProfile.mockResolvedValue(user);

      await expect(service.getMe('user-1')).resolves.toBe(user);
      expect(userActions.findByIdWithCreatorProfile).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('replaces avatarUrl with a signed URL when an uploaded avatar exists', async () => {
      const user = buildUser({ avatarS3Key: 'avatars/user-1/123' });
      userActions.findByIdWithCreatorProfile.mockResolvedValue(user);
      storageService.getPresignedDownloadUrl.mockResolvedValue(
        'https://signed-avatar',
      );

      const result = await service.getMe('user-1');

      expect(storageService.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'motion-mesh',
        'avatars/user-1/123',
      );
      expect(result.avatarUrl).toBe('https://signed-avatar');
    });

    it('leaves an external avatarUrl untouched when no uploaded avatar exists', async () => {
      const user = buildUser({ avatarUrl: 'https://google/photo.jpg' });
      userActions.findByIdWithCreatorProfile.mockResolvedValue(user);

      const result = await service.getMe('user-1');

      expect(storageService.getPresignedDownloadUrl).not.toHaveBeenCalled();
      expect(result.avatarUrl).toBe('https://google/photo.jpg');
    });

    it('throws NotFound when the user does not exist', async () => {
      userActions.findByIdWithCreatorProfile.mockResolvedValue(null);
      await expect(service.getMe('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvatarUploadUrl', () => {
    it('signs a PUT under the avatars/<userId>/ prefix', async () => {
      userActions.findById.mockResolvedValue(buildUser());
      storageService.getPresignedUploadUrl.mockResolvedValue('https://put');

      const result = await service.getAvatarUploadUrl('user-1', 'image/png');

      expect(result.url).toBe('https://put');
      expect(result.key).toMatch(/^avatars\/user-1\/\d+$/);
      expect(storageService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'motion-mesh',
        result.key,
        'image/png',
      );
    });

    it('throws NotFound when the user does not exist', async () => {
      userActions.findById.mockResolvedValue(null);
      await expect(
        service.getAvatarUploadUrl('missing', 'image/png'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('applies the patch and saves', async () => {
      const user = buildUser();
      userActions.findById.mockResolvedValue(user);
      userActions.save.mockImplementation((u) => Promise.resolve(u));
      userActions.findByIdWithCreatorProfile.mockResolvedValue(user);

      const result = await service.updateProfile('user-1', {
        firstName: 'Janet',
      });

      expect(result.firstName).toBe('Janet');
      expect(userActions.save).toHaveBeenCalledWith(user);
    });

    it('deletes the replaced avatar object when the key changes', async () => {
      const user = buildUser({ avatarS3Key: 'avatars/user-1/old' });
      userActions.findById.mockResolvedValue(user);
      userActions.save.mockImplementation((u) => Promise.resolve(u));
      userActions.findByIdWithCreatorProfile.mockResolvedValue(user);

      await service.updateProfile('user-1', {
        avatarS3Key: 'avatars/user-1/new',
      });

      expect(storageService.deleteObject).toHaveBeenCalledWith(
        'motion-mesh',
        'avatars/user-1/old',
      );
    });

    it('throws NotFound when the user does not exist', async () => {
      userActions.findById.mockResolvedValue(null);
      await expect(
        service.updateProfile('missing', { firstName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateActiveMode', () => {
    it('persists the mode and returns the reloaded user', async () => {
      const user = buildUser();
      userActions.findById.mockResolvedValue(user);
      userActions.save.mockImplementation((u) => Promise.resolve(u));
      userActions.findByIdWithCreatorProfile.mockResolvedValue(
        buildUser({ lastActiveMode: ActiveMode.SELLER }),
      );

      const result = await service.updateActiveMode(
        'user-1',
        ActiveMode.SELLER,
      );

      expect(user.lastActiveMode).toBe(ActiveMode.SELLER);
      expect(userActions.save).toHaveBeenCalledWith(user);
      expect(result.lastActiveMode).toBe(ActiveMode.SELLER);
    });

    it('throws NotFound when the user does not exist', async () => {
      userActions.findById.mockResolvedValue(null);
      await expect(
        service.updateActiveMode('missing', ActiveMode.BUYER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('removes the user', async () => {
      const user = buildUser();
      userActions.findById.mockResolvedValue(user);
      userActions.remove.mockResolvedValue(user);

      await service.deleteAccount('user-1');
      expect(userActions.remove).toHaveBeenCalledWith(user);
    });

    it('throws NotFound when the user does not exist', async () => {
      userActions.findById.mockResolvedValue(null);
      await expect(service.deleteAccount('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
