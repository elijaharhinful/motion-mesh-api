import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

export const ApiRegister = () =>
  applyDecorators(
    ApiOperation({ summary: 'Register a new user account' }),
    ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully.' }),
    ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already taken.' }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' }),
  );

export const ApiLogin = () =>
  applyDecorators(
    ApiOperation({ summary: 'Log in with email and password' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Login successful. Returns access token.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials.' }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed.' }),
  );

export const ApiRefresh = () =>
  applyDecorators(
    ApiOperation({ summary: 'Refresh the access token using a refresh token' }),
    ApiResponse({ status: HttpStatus.OK, description: 'New access token issued.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Refresh token invalid or expired.' }),
  );

export const ApiLogout = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Log out and invalidate refresh token' }),
    ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Logged out successfully.' }),
    ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated.' }),
  );
