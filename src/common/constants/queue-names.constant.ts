export const QUEUE_NAMES = {
  VIDEO_PROCESSING: 'video-processing', // Transcode, watermark, thumbnail pipeline
  VIDEO_GENERATION: 'video-generation', // Kling AI generation pipeline
  PAYOUTS: 'payouts', // Daily creator payout transfers
  EMAIL: 'email', // Async email dispatch via Resend
} as const;
