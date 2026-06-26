import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    description:
      'Object-storage key of an uploaded avatar, obtained from POST /users/me/avatar/presigned-url.',
    example: 'avatars/2b9f.../1782160200000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarS3Key?: string;
}
