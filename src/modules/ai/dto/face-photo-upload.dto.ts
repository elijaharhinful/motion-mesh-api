import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FacePhotoUploadDto {
  @ApiProperty({
    description: 'MIME type of the face photo to upload.',
    example: 'image/jpeg',
  })
  @IsString()
  @Matches(/^image\/(png|jpe?g|webp)$/, {
    message: 'contentType must be a supported image type',
  })
  contentType: string;
}
