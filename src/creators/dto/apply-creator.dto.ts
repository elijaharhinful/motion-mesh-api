import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyCreatorDto {
  @ApiPropertyOptional({ example: 'Professional hip-hop dancer with 10 years experience.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/myhandle' })
  @IsOptional()
  @IsUrl()
  socialLink?: string;
}
