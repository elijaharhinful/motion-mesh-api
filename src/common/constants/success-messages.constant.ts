export const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS:
    'Account created successfully. Please check your email to verify your account.',
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  GOOGLE_LOGIN_SUCCESS: 'Signed in with Google successfully.',
  EMAIL_VERIFIED: 'Your email address has been verified. You can now log in.',
  PASSWORD_RESET_SENT:
    'Password reset instructions have been sent to your email.',
  PASSWORD_RESET_SUCCESS:
    'Your password has been reset successfully. Please log in.',
  // Users
  PROFILE_UPDATED: 'Your profile has been updated successfully.',
  ACCOUNT_DELETE_REQUESTED:
    'Your account deletion request has been received and will be processed within 30 days.',
  // Creators
  CREATOR_PROFILE_UPDATED:
    'Your creator profile has been updated successfully.',
  STRIPE_ONBOARD_INITIATED:
    'Stripe onboarding started. Complete the setup to receive payouts.',
  STRIPE_ONBOARD_COMPLETE: 'Stripe payout account connected successfully.',
  // Videos
  VIDEO_CREATED: 'Video created. Please upload your file to continue.',
  VIDEO_UPLOADED: 'Video uploaded successfully and is now being processed.',
  VIDEO_PUBLISHED: 'Your dance video is now live on the marketplace.',
  VIDEO_UPDATED: 'Video details updated successfully.',
  VIDEO_UNPUBLISHED:
    'Your video has been unpublished and is no longer visible.',
  VIDEO_DELETED: 'Your video has been deleted successfully.',
  // Purchases
  PURCHASE_SUCCESS:
    'Purchase successful! You can now generate your personalised dance video.',
  REFUND_ISSUED: 'A refund has been issued to your original payment method.',
  // Generation
  GENERATION_QUEUED:
    'Your video is being generated. We will notify you when it is ready.',
  GENERATION_COMPLETE:
    'Your personalised dance video is ready to preview and download.',
  PHOTO_UPLOAD_SUCCESS:
    'Photo uploaded successfully. Ready to generate your video.',
  // Payouts
  PAYOUT_ISSUED:
    'Your payout has been sent and should arrive within 2-5 business days.',
} as const;

/** Generic fetch message — use for GET endpoints. e.g. fetchSuccess('profile') */
export const fetchSuccess = (resource: string) =>
  `${resource} retrieved successfully.`;
