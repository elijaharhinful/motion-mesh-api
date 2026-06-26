import { VideoCategory } from '../enums/video-category.enum';
import { VideoDifficulty } from '../enums/video-difficulty.enum';
import { VideoStatus } from '../enums/video-status.enum';

/**
 * Public-facing shapes for the marketplace. These deliberately omit raw S3 keys
 * (especially `originalS3Key`) and expose only signed, time-limited URLs for the
 * preview and thumbnail. The original asset is never referenced in a response.
 */

export interface PublicVideoCreator {
  id: string;
  displayName: string;
  isVerified: boolean;
  avatarUrl: string | null;
}

export interface PublicVideoView {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  difficulty: VideoDifficulty;
  category: VideoCategory;
  priceCents: number;
  status: VideoStatus;
  durationSeconds: number | null;
  /** Signed, time-limited URL for the catalogue thumbnail. */
  thumbnailUrl: string | null;
  /** Signed, time-limited URL for the watermarked preview (detail view only). */
  previewUrl: string | null;
  creator: PublicVideoCreator | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Seller-facing view of their own listing. Still hides raw keys, but surfaces
 * upload-completeness booleans so the dashboard knows what is missing before a
 * video can be published.
 */
export interface SellerVideoView {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  difficulty: VideoDifficulty;
  category: VideoCategory;
  priceCents: number;
  status: VideoStatus;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  hasOriginal: boolean;
  hasPreview: boolean;
  hasThumbnail: boolean;
  createdAt: Date;
  updatedAt: Date;
}
