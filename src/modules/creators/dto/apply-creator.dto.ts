import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyCreatorDto {
  @ApiProperty({ example: 'Jordan Rivera' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({
    example: 'Professional hip-hop dancer with 10 years experience.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/myhandle' })
  @IsOptional()
  @IsUrl()
  socialLink?: string;
}
