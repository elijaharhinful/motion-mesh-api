import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VideoCategory } from '../enums/video-category.enum';
import { VideoDifficulty } from '../enums/video-difficulty.enum';

export class UpdateVideoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: VideoDifficulty })
  @IsOptional()
  @IsEnum(VideoDifficulty)
  difficulty?: VideoDifficulty;

  @ApiPropertyOptional({ enum: VideoCategory })
  @IsOptional()
  @IsEnum(VideoCategory)
  category?: VideoCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(99)
  @Max(9999)
  priceCents?: number;
}
