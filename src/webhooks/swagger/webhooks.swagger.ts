import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiStripeWebhook = () =>
  applyDecorators(
    ApiOperation({ summary: 'Receive Stripe webhook events (internal use only)' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Event processed.' }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid signature or raw body.' }),
  );
