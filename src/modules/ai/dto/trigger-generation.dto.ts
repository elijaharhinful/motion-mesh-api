import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TriggerGenerationDto {
  @ApiProperty({ description: 'ID of the successful purchase' })
  @IsUUID()
  purchaseId: string;

  @ApiProperty({ description: 'S3 key of the uploaded face photo' })
  @IsString()
  facePhotoS3Key: string;
}
