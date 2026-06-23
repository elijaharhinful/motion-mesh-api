import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreatorsService } from '../creators.service';
import { CreatorProfileActions } from '../actions/creator-profile.actions';
import { CreatorProfile } from '../entities/creator-profile.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';

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
    creatorProfile: null,
    isSeller: false,
    ...overrides,
  }) as unknown as User;

const buildProfile = (
  overrides: Partial<CreatorProfile> = {},
): CreatorProfile =>
  ({
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'Jordan Rivera',
    bio: null,
    socialLink: null,
    stripeConnectAccountId: null,
    isVerified: false,
    ...overrides,
  }) as unknown as CreatorProfile;

describe('CreatorsService', () => {
  let service: CreatorsService;
  let actions: jest.Mocked<CreatorProfileActions>;

  beforeEach(() => {
    actions = {
      findByUserId: jest.fn(),
      findByUserIdWithUser: jest.fn(),
      findByIdWithUser: jest.fn(),
      findVerifiedWithUser: jest.fn(),
      findOwned: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<CreatorProfileActions>;

    service = new CreatorsService(actions);
  });

  describe('apply', () => {
    it('creates a CreatorProfile from the DTO and saves it', async () => {
      const user = buildUser();
      const created = buildProfile({ bio: 'hip-hop' });
      actions.findByUserId.mockResolvedValue(null);
      actions.create.mockReturnValue(created);
      actions.save.mockResolvedValue(created);

      const result = await service.apply(user, {
        displayName: 'Jordan Rivera',
        bio: 'hip-hop',
      });

      expect(actions.create).toHaveBeenCalledWith({
        userId: 'user-1',
        displayName: 'Jordan Rivera',
        bio: 'hip-hop',
        socialLink: null,
      });
      expect(actions.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('throws Conflict when the user already has a profile', async () => {
      actions.findByUserId.mockResolvedValue(buildProfile());

      await expect(
        service.apply(buildUser(), { displayName: 'Jordan Rivera' }),
      ).rejects.toThrow(ConflictException);
      expect(actions.create).not.toHaveBeenCalled();
    });
  });

  describe('getProfileById', () => {
    it('returns the profile with its user loaded', async () => {
      const profile = buildProfile();
      actions.findByIdWithUser.mockResolvedValue(profile);

      await expect(service.getProfileById('profile-1')).resolves.toBe(profile);
      expect(actions.findByIdWithUser).toHaveBeenCalledWith('profile-1');
    });

    it('throws NotFound when the profile is missing', async () => {
      actions.findByIdWithUser.mockResolvedValue(null);
      await expect(service.getProfileById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMyProfile', () => {
    it('returns the caller profile', async () => {
      const profile = buildProfile();
      actions.findByUserIdWithUser.mockResolvedValue(profile);

      await expect(service.getMyProfile('user-1')).resolves.toBe(profile);
      expect(actions.findByUserIdWithUser).toHaveBeenCalledWith('user-1');
    });

    it('throws NotFound when the caller has no profile', async () => {
      actions.findByUserIdWithUser.mockResolvedValue(null);
      await expect(service.getMyProfile('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('applies the patch and saves', async () => {
      const profile = buildProfile();
      actions.findByUserId.mockResolvedValue(profile);
      actions.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.updateProfile('user-1', {
        displayName: 'Jordan R.',
      });

      expect(result.displayName).toBe('Jordan R.');
      expect(actions.save).toHaveBeenCalledWith(profile);
    });

    it('throws NotFound when the caller has no profile', async () => {
      actions.findByUserId.mockResolvedValue(null);
      await expect(
        service.updateProfile('user-1', { bio: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listCreators', () => {
    it('returns the verified creators', async () => {
      const profiles = [buildProfile({ isVerified: true })];
      actions.findVerifiedWithUser.mockResolvedValue(profiles);

      await expect(service.listCreators()).resolves.toBe(profiles);
    });
  });

  describe('assertCreatorOwnsProfile', () => {
    it('resolves when the profile is owned by the user', async () => {
      actions.findOwned.mockResolvedValue(buildProfile());

      await expect(
        service.assertCreatorOwnsProfile('user-1', 'profile-1'),
      ).resolves.toBeUndefined();
      expect(actions.findOwned).toHaveBeenCalledWith('profile-1', 'user-1');
    });

    it('throws Forbidden when the user does not own the profile', async () => {
      actions.findOwned.mockResolvedValue(null);
      await expect(
        service.assertCreatorOwnsProfile('user-2', 'profile-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
