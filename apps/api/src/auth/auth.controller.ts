import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { PublicUser } from '@balance/shared';
import type { Request, Response } from 'express';
import { AuthCookiesService, REFRESH_COOKIE } from './auth-cookies.service';
import { ChangePasswordDto, LoginDto, PublicUserDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
import type { AuthUser, SessionMeta } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookiesService,
  ) {}

  @Public()
  @Post('register')
  @ApiCreatedResponse({ type: PublicUserDto })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const { user, tokens } = await this.auth.register(dto, sessionMeta(req));
    this.cookies.set(res, tokens);
    return user;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PublicUserDto })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicUser> {
    const { user, tokens } = await this.auth.login(dto, sessionMeta(req));
    this.cookies.set(res, tokens);
    return user;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    try {
      this.cookies.set(res, await this.auth.refresh(refreshTokenOf(req)));
    } catch (error) {
      this.cookies.clear(res);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(refreshTokenOf(req));
    this.cookies.clear(res);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiNoContentResponse()
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    this.cookies.set(res, await this.auth.changePassword(user, dto));
  }

  @Get('me')
  @ApiCookieAuth()
  @ApiOkResponse({ type: PublicUserDto })
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.auth.me(user.userId);
  }
}

function sessionMeta(req: Request): SessionMeta {
  return { userAgent: req.get('user-agent')?.slice(0, 500), ip: req.ip };
}

function refreshTokenOf(req: Request): string | undefined {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof token === 'string' && token ? token : undefined;
}
