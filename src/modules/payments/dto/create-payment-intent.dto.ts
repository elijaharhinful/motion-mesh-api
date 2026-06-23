import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'uuid-of-dance-video' })
  @IsUUID()
  videoId: string;
}
