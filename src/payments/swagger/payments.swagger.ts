import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiCreatePaymentIntent = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Create a Stripe Payment Intent for a video purchase' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Payment intent created. Returns clientSecret.' }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Video not found or not published.' }),
    ApiResponse({ status: HttpStatus.CONFLICT, description: 'Video already purchased.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );

export const ApiListPurchases = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'List the current user\'s purchase history' }),
    ApiResponse({ status: HttpStatus.OK, description: 'List of successful purchases.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );
