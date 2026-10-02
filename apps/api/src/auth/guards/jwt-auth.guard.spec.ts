import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { SessionsRepository } from '../sessions.repository';
import type { TokensService } from '../tokens.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const tokens = { verifyAccess: jest.fn() };
  const sessions = { findActive: jest.fn() };
  const guard = new JwtAuthGuard(
    reflector as unknown as Reflector,
    tokens as unknown as TokensService,
    sessions as unknown as SessionsRepository,
  );

  function contextWith(request: Record<string, unknown>): ExecutionContext {
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('пропускает @Public() маршруты без токена', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(contextWith({}))).resolves.toBe(true);
    expect(tokens.verifyAccess).not.toHaveBeenCalled();
  });

  it('401 без cookie', async () => {
    await expect(guard.canActivate(contextWith({ cookies: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('401 при невалидном токене', async () => {
    tokens.verifyAccess.mockRejectedValueOnce(new Error('jwt expired'));
    await expect(
      guard.canActivate(contextWith({ cookies: { access_token: 'bad' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('401, если сессия отозвана', async () => {
    tokens.verifyAccess.mockResolvedValueOnce({ sub: 'user-1', sid: 'session-1' });
    sessions.findActive.mockResolvedValueOnce(null);
    await expect(
      guard.canActivate(contextWith({ cookies: { access_token: 'ok' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('кладёт пользователя в request при активной сессии', async () => {
    const request: Record<string, unknown> = { cookies: { access_token: 'ok' } };
    tokens.verifyAccess.mockResolvedValueOnce({ sub: 'user-1', sid: 'session-1' });
    sessions.findActive.mockResolvedValueOnce({ id: 'session-1', userId: 'user-1' });

    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'user-1', sessionId: 'session-1' });
  });
});
