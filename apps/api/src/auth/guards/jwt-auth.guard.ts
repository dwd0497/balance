import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ACCESS_COOKIE } from '../auth-cookies.service';
import type { AuthenticatedRequest } from '../auth.types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionsRepository } from '../sessions.repository';
import { TokensService } from '../tokens.service';

/**
 * Глобальный guard: проверяет access-токен из cookie и то, что сессия не отозвана,
 * поэтому logout и смена пароля действуют сразу.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokensService,
    private readonly sessions: SessionsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token: unknown = request.cookies?.[ACCESS_COOKIE];
    if (typeof token !== 'string' || !token) throw new UnauthorizedException();

    const payload = await this.tokens.verifyAccess(token).catch(() => {
      throw new UnauthorizedException();
    });
    const session = await this.sessions.findActive(payload.sid);
    if (!session || session.userId !== payload.sub) throw new UnauthorizedException();

    (request as AuthenticatedRequest).user = { userId: payload.sub, sessionId: payload.sid };
    return true;
  }
}
