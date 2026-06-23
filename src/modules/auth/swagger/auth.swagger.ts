import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiRegister = () =>
  applyDecorators(
    ApiOperation({ summary: 'Register a new user account' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'User registered successfully.',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email already taken.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation failed.',
    }),
  );

export const ApiLogin = () =>
  applyDecorators(
    ApiOperation({ summary: 'Log in with email and password' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Login successful. Returns access token.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials.',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation failed.',
    }),
  );

export const ApiRefresh = () =>
  applyDecorators(
    ApiOperation({ summary: 'Refresh the access token using a refresh token' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'New access token issued.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Refresh token invalid or expired.',
    }),
  );

export const ApiLogout = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Log out and invalidate refresh token' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: 'Logged out successfully.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Not authenticated.',
    }),
  );

export const ApiVerifyEmail = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify an email address using the emailed token',
    }),
    ApiResponse({ status: HttpStatus.OK, description: 'Email verified.' }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Verification token invalid or expired.',
    }),
  );

export const ApiResendVerification = () =>
  applyDecorators(
    ApiOperation({ summary: 'Resend the email verification link' }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'If the account exists and is unverified, a link has been sent.',
    }),
  );

export const ApiForgotPassword = () =>
  applyDecorators(
    ApiOperation({ summary: 'Request a password reset link' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'If the account exists, a reset link has been sent.',
    }),
  );

export const ApiResetPassword = () =>
  applyDecorators(
    ApiOperation({ summary: 'Reset the password using the emailed token' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Password reset.' }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Reset token invalid or expired.',
    }),
  );

export const ApiGoogleAuth = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Initiate Google OAuth 2.0 login — browser redirect to Google consent screen',
    }),
    ApiResponse({
      status: HttpStatus.FOUND,
      description: 'Redirects to Google consent screen.',
    }),
  );

export const ApiGoogleCallback = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Google OAuth 2.0 callback — issues tokens and redirects to frontend',
    }),
    ApiResponse({
      status: HttpStatus.FOUND,
      description: 'Redirects to FRONTEND_URL/auth/callback?accessToken=...',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Google OAuth failed.',
    }),
  );
