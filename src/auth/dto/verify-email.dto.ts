import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'The verification token from the email link.' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
