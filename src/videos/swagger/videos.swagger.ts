import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiCreateVideo = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Create a new dance video listing (Creator only)' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Video created.' }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Creator role required.' }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' }),
  );

export const ApiListVideos = () =>
  applyDecorators(
    ApiOperation({ summary: 'List published dance videos with optional filters' }),
    ApiResponse({ status: HttpStatus.OK, description: 'List of videos.' }),
  );

export const ApiGetVideo = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a single dance video by ID' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Video details.' }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Video not found.' }),
  );

export const ApiUpdateVideo = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update a video listing (owning Creator only)' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Video updated.' }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not the owner.' }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Video not found.' }),
  );

export const ApiDeleteVideo = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete a video listing (owning Creator only)' }),
    ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Video deleted.' }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not the owner.' }),
  );

export const ApiPublishVideo = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Publish a video (make it publicly listed)' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Video published.' }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not the owner.' }),
  );

export const ApiGetVideoPresignedUrl = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get a presigned S3 URL for direct file upload' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Presigned URL returned.' }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not the owner.' }),
  );
