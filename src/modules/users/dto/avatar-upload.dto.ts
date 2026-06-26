import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AvatarUploadDto {
  @ApiProperty({
    description: 'MIME type of the image to upload.',
    example: 'image/png',
  })
  @IsString()
  @Matches(/^image\/(png|jpe?g|webp|gif)$/, {
    message: 'contentType must be a supported image type',
  })
  contentType: string;
}
