import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiTriggerGeneration = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Trigger AI video generation for a purchased dance video' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'Generation job created and queued.' }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Purchase not found or not completed.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );

export const ApiGetJobStatus = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get the status of a generation job' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Generation job details.' }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job not found.' }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Job belongs to another user.' }),
  );
