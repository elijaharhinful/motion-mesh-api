import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiApplyCreator = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Apply to become a creator' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Creator profile created.' }),
    ApiResponse({ status: HttpStatus.CONFLICT, description: 'Already applied.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );

export const ApiListCreators = () =>
  applyDecorators(
    ApiOperation({ summary: 'List all verified creators' }),
    ApiResponse({ status: HttpStatus.OK, description: 'List of creator profiles.' }),
  );

export const ApiGetCreator = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a creator profile by ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Creator profile.' }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Creator not found.' }),
  );

export const ApiGetMyCreatorProfile = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get the current user\'s creator profile' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Creator profile.' }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not a creator yet.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );

export const ApiUpdateCreatorProfile = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update the current user\'s creator profile' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Creator profile updated.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );
