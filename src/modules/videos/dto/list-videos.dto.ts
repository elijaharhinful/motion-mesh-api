import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VideoCategory } from '../enums/video-category.enum';
import { VideoDifficulty } from '../enums/video-difficulty.enum';
import { VideoSort } from '../enums/video-sort.enum';

export class ListVideosDto {
  @ApiPropertyOptional({ description: 'Filter by creator profile id' })
  @IsOptional()
  @IsUUID()
  creatorId?: string;

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

  @ApiPropertyOptional({
    description: 'Free-text search over title and description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: VideoSort, default: VideoSort.NEWEST })
  @IsOptional()
  @IsEnum(VideoSort)
  sort?: VideoSort;
}
