import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SellerGuard } from '../guards/seller.guard';
import { UserRole } from '../../users/enums/user-role.enum';

describe('SellerGuard', () => {
  let guard: SellerGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const context = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new SellerGuard(reflector as unknown as Reflector);
  });

  it('allows the request when seller capability is not required', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    expect(guard.canActivate(context({ role: UserRole.MEMBER }))).toBe(true);
  });

  it('lets an admin bypass even without a creator profile', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(
      guard.canActivate(
        context({ role: UserRole.ADMIN, creatorProfile: null }),
      ),
    ).toBe(true);
  });

  it('allows a member who has a creator profile', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(
      guard.canActivate(
        context({ role: UserRole.MEMBER, creatorProfile: { id: 'cp-1' } }),
      ),
    ).toBe(true);
  });

  it('forbids a member without a creator profile', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(() =>
      guard.canActivate(
        context({ role: UserRole.MEMBER, creatorProfile: null }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('forbids when there is no authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(() => guard.canActivate(context(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
