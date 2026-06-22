import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as requiring SELLER capability (an active CreatorProfile).
 * Enforced by SellerGuard. Capability-based — NOT a role. Admins bypass.
 */
export const REQUIRE_SELLER_KEY = 'requireSeller';
export const RequireSeller = () => SetMetadata(REQUIRE_SELLER_KEY, true);
