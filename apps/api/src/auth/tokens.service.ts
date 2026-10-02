import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Env } from '../config';
import type { AuthTokens } from './auth.types';

export interface TokenPayload {
  /** userId */
  sub: string;
  /** sessionId */
  sid: string;
}

@Injectable()
export class TokensService {
  readonly accessTtlSec: number;
  readonly refreshTtlSec: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService<Env, true>,
  ) {
    this.accessTtlSec = config.get('JWT_ACCESS_TTL_SEC', { infer: true });
    this.refreshTtlSec = config.get('JWT_REFRESH_TTL_SEC', { infer: true });
    this.accessSecret = config.get('JWT_ACCESS_SECRET', { infer: true });
    this.refreshSecret = config.get('JWT_REFRESH_SECRET', { infer: true });
  }

  async issue(userId: string, sessionId: string): Promise<AuthTokens> {
    const payload: TokenPayload = { sub: userId, sid: sessionId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { secret: this.accessSecret, expiresIn: this.accessTtlSec }),
      // jti делает каждый refresh-токен уникальным, даже если выпущен в ту же секунду
      this.jwt.signAsync(
        { ...payload, jti: randomUUID() },
        { secret: this.refreshSecret, expiresIn: this.refreshTtlSec },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
      refreshExpiresAt: new Date(Date.now() + this.refreshTtlSec * 1000),
    };
  }

  verifyAccess(token: string): Promise<TokenPayload> {
    return this.jwt.verifyAsync<TokenPayload>(token, { secret: this.accessSecret });
  }

  verifyRefresh(token: string): Promise<TokenPayload> {
    return this.jwt.verifyAsync<TokenPayload>(token, { secret: this.refreshSecret });
  }

  /** Refresh-токен высокоэнтропийный, поэтому достаточно быстрого sha256. */
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
