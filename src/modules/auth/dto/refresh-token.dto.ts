import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  // Optional: the refresh token normally arrives via the HttpOnly `refresh_token`
  // cookie (the handler prefers the cookie and only falls back to this body
  // field). Requiring it would make the global ValidationPipe reject the
  // cookie-only refresh/logout requests the web client sends.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
