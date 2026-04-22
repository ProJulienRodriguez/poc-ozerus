import { Body, Controller, Get, Post, Req, UseGuards, HttpCode } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

class LoginStartDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(4) password!: string;
}

class LoginCompleteDto {
  @IsString() challengeId!: string;
  @IsString() @MinLength(6) code!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginStartDto) {
    return this.auth.startLogin(dto.email, dto.password);
  }

  @Post('login/mfa')
  @HttpCode(200)
  mfa(@Body() dto: LoginCompleteDto) {
    return this.auth.completeLogin(dto.challengeId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(204)
  logout() {
    return;
  }
}
