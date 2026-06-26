import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiTriggerGeneration = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Trigger AI video generation for a purchased dance video',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Generation job created and queued.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Purchase not found or not completed.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Not authenticated.',
    }),
  );

export const ApiGetFacePhotoUploadUrl = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Get a presigned URL to upload a face photo directly to storage for generation',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Presigned upload URL and object key returned.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Not authenticated.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Unsupported image content type.',
    }),
  );

export const ApiGetJobStatus = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get the status of a generation job' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Generation job details.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Job not found.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Job belongs to another user.',
    }),
  );

export const ApiGetResultDownloadUrl = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get a presigned URL to download a completed generation result',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Presigned download URL returned.',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Job not found or result not ready yet.',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Job belongs to another user.',
    }),
  );
