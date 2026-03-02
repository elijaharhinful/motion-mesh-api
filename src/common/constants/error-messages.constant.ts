export const ERROR_MESSAGES = {
  // ─── Auth ───────────────────────────────────────────────────────────────────
  AUTH_EMAIL_TAKEN: 'An account with this email already exists.',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
  AUTH_EMAIL_NOT_VERIFIED: 'Please verify your email before logging in.',
  AUTH_INVALID_REFRESH_TOKEN: 'Refresh token is invalid or expired.',
  AUTH_UNAUTHORIZED: 'You must be logged in to perform this action.',

  // ─── Users ──────────────────────────────────────────────────────────────────
  USER_NOT_FOUND: 'User not found.',

  // ─── Creators ───────────────────────────────────────────────────────────────
  CREATOR_PROFILE_NOT_FOUND: 'Creator profile not found.',
  CREATOR_ALREADY_APPLIED: 'You have already applied to become a creator.',
  CREATOR_NOT_VERIFIED: 'Your creator profile is not yet verified.',
  CREATOR_FORBIDDEN: 'This action requires a verified creator account.',

  // ─── Videos ─────────────────────────────────────────────────────────────────
  VIDEO_NOT_FOUND: 'Dance video not found.',
  VIDEO_FORBIDDEN: 'You do not have permission to modify this video.',
  VIDEO_NOT_PUBLISHED: 'This video is not available for purchase.',

  // ─── Payments ───────────────────────────────────────────────────────────────
  PAYMENT_INTENT_FAILED: 'Failed to create payment intent.',
  PURCHASE_NOT_FOUND: 'Purchase not found.',
  ALREADY_PURCHASED: 'You have already purchased this video.',

  // ─── AI / Generation ────────────────────────────────────────────────────────
  GENERATION_JOB_NOT_FOUND: 'Generation job not found.',
  GENERATION_JOB_FORBIDDEN: 'You do not have access to this generation job.',
  KLING_API_ERROR: 'AI video generation service encountered an error.',
  PURCHASE_REQUIRED: 'You must purchase this video before generating.',

  // ─── Storage ─────────────────────────────────────────────────────────────────
  STORAGE_UPLOAD_FAILED: 'Failed to upload file.',
  STORAGE_PRESIGN_FAILED: 'Failed to generate upload URL.',

  // ─── General ─────────────────────────────────────────────────────────────────
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again.',
  VALIDATION_FAILED: 'Request validation failed.',
} as const;
