import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  ApiRegister,
  ApiLogin,
  ApiRefresh,
  ApiLogout,
  ApiVerifyEmail,
  ApiResendVerification,
  ApiForgotPassword,
  ApiResetPassword,
  ApiGoogleAuth,
  ApiGoogleCallback,
} from './swagger/auth.swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  SUCCESS_MESSAGES,
  fetchSuccess,
} from '../common/constants/success-messages.constant';

const REFRESH_COOKIE = 'refresh_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiRegister()
  async register(@Body() dto: RegisterDto) {
    // No session is issued — the user must verify their email before logging in.
    const { user } = await this.authService.register(dto);
    return { _message: SUCCESS_MESSAGES.REGISTER_SUCCESS, data: { user } };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyEmail()
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const user = await this.authService.verifyEmail(dto.token);
    return { _message: SUCCESS_MESSAGES.EMAIL_VERIFIED, data: { user } };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiResendVerification()
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto.email);
    return { _message: SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiForgotPassword()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { _message: SUCCESS_MESSAGES.PASSWORD_RESET_SENT };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiResetPassword()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { _message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);
    this.setRefreshCookie(res, refreshToken);
    return {
      _message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      data: { user, accessToken },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiRefresh()
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Prefer cookie, fall back to body
    const token: string =
      (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ??
      dto.refreshToken;
    const { accessToken, refreshToken } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { _message: fetchSuccess('token'), data: { accessToken } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiLogout()
  async logout(
    @CurrentUser() _user: User,
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token: string =
      (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ??
      dto.refreshToken;
    await this.authService.logout(token);
    res.clearCookie(REFRESH_COOKIE);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiGoogleAuth()
  googleAuth(): void {
    // Passport redirects to Google — no body needed
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiGoogleCallback()
  googleCallback(
    @Req()
    req: Request & {
      user: { user: User; accessToken: string; refreshToken: string };
    },
    @Res() res: Response,
  ): void {
    const { accessToken, refreshToken } = req.user;
    this.setRefreshCookie(
      res as unknown as import('express').Response,
      refreshToken,
    );

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    (res as unknown as import('express').Response).redirect(
      `${frontendUrl}/auth/callback?accessToken=${encodeURIComponent(accessToken)}`,
    );
  }
}
