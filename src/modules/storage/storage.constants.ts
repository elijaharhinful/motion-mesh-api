/**
 * Folder (key) prefixes inside the single object-storage bucket. Assets are
 * separated by prefix instead of separate buckets. Keep these in sync with the
 * R2/S3 CORS and lifecycle rules if any are scoped per prefix.
 */
export const STORAGE_PREFIX = {
  /** Creator video assets: videos/{original|preview|thumbnail}/<videoId>/<ts> */
  videos: 'videos',
  /** Buyer face photos for AI generation: uploads/<userId>/<ts> */
  uploads: 'uploads',
  /** AI result videos: generations/<jobId>/<ts>.mp4 */
  generations: 'generations',
  /** User profile pictures: avatars/<userId>/<ts> */
  avatars: 'avatars',
} as const;
