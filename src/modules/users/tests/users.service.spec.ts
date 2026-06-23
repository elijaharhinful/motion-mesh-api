import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { UserActions } from '../actions/user.actions';
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
    creatorProfile: null,
    isSeller: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as User;

describe('UsersService', () => {
  let service: UsersService;
  let userActions: jest.Mocked<UserActions>;

  beforeEach(() => {
    userActions = {
      findById: jest.fn(),
      findByIdWithCreatorProfile: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<UserActions>;

    service = new UsersService(userActions);
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

    it('throws NotFound when the user does not exist', async () => {
      userActions.findByIdWithCreatorProfile.mockResolvedValue(null);
      await expect(service.getMe('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('applies the patch and saves', async () => {
      const user = buildUser();
      userActions.findById.mockResolvedValue(user);
      userActions.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateProfile('user-1', {
        firstName: 'Janet',
      });

      expect(result.firstName).toBe('Janet');
      expect(userActions.save).toHaveBeenCalledWith(user);
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
