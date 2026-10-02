import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { Env } from '../config';
import type { AuthTokens } from './auth.types';
import { TokensService } from './tokens.service';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
/** Refresh-cookie отправляется браузером только на эндпоинты /auth/*. */
const REFRESH_COOKIE_PATH = '/auth';

@Injectable()
export class AuthCookiesService {
  private readonly base: CookieOptions;

  constructor(
    private readonly tokens: TokensService,
    config: ConfigService<Env, true>,
  ) {
    this.base = {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.get('NODE_ENV', { infer: true }) === 'production',
    };
  }

  set(res: Response, tokens: AuthTokens): void {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.base,
      path: '/',
      maxAge: this.tokens.accessTtlSec * 1000,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.base,
      path: REFRESH_COOKIE_PATH,
      expires: tokens.refreshExpiresAt,
    });
  }

  clear(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, { ...this.base, path: '/' });
    res.clearCookie(REFRESH_COOKIE, { ...this.base, path: REFRESH_COOKIE_PATH });
  }
}
