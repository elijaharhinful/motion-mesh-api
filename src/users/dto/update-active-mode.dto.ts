import { IsEnum } from 'class-validator';
import { ActiveMode } from '../enums/active-mode.enum';

/**
 * Persists the user's last active workspace as a UI preference.
 * NOT an authorization change — see Identity Spec §5.
 */
export class UpdateActiveModeDto {
  @IsEnum(ActiveMode)
  mode: ActiveMode;
}
