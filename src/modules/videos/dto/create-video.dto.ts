import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VideoCategory } from '../enums/video-category.enum';
import { VideoDifficulty } from '../enums/video-difficulty.enum';

export class CreateVideoDto {
  @ApiProperty({ example: 'Afrobeats Groove Vol. 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'A fun intro routine for beginners.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: VideoDifficulty })
  @IsEnum(VideoDifficulty)
  difficulty: VideoDifficulty;

  @ApiProperty({ enum: VideoCategory })
  @IsEnum(VideoCategory)
  category: VideoCategory;

  @ApiProperty({
    example: 499,
    description: 'Price in cents (e.g. 499 = $4.99)',
  })
  @IsInt()
  @Min(99)
  @Max(9999)
  priceCents: number;
}
