import { SetMetadata } from '@nestjs/common';

export const REQUIRE_CREATOR_PROFILE_KEY = 'requireCreatorProfile';
export const RequireCreatorProfile = () =>
  SetMetadata(REQUIRE_CREATOR_PROFILE_KEY, true);
