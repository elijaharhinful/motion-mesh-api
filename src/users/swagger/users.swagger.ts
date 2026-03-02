import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiGetMe = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get the currently authenticated user profile' }),
    ApiResponse({ status: HttpStatus.OK, description: 'User profile returned.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );

export const ApiUpdateMe = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update the current user profile' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Profile updated.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' }),
  );

export const ApiDeleteMe = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete the current user account' }),
    ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Account deleted.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );
