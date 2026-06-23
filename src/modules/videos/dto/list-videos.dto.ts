import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VideoCategory } from '../enums/video-category.enum';
import { VideoDifficulty } from '../enums/video-difficulty.enum';

export class ListVideosDto {
  @ApiPropertyOptional({ enum: VideoCategory })
  @IsOptional()
  @IsEnum(VideoCategory)
  category?: VideoCategory;

  @ApiPropertyOptional({ enum: VideoDifficulty })
  @IsOptional()
  @IsEnum(VideoDifficulty)
  difficulty?: VideoDifficulty;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPriceCents?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPriceCents?: number;
}
