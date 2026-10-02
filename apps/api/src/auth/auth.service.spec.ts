import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ChangeUserPasswordCommand,
  CreateUserCommand,
  GetUserByIdQuery,
  GetUserCredentialsQuery,
  RecordUserLoginCommand,
} from '../users/contracts';
import { AuthService } from './auth.service';
import type { PasswordService } from './password.service';
import type { SessionsRepository } from './sessions.repository';
import type { TokensService } from './tokens.service';

const user = {
  id: 'user-1',
  email: 'ivan@example.com',
  firstName: 'Иван',
  lastName: 'Петров',
  createdAt: new Date(0).toISOString(),
};
const credentials = { id: user.id, passwordHash: 'stored-hash', isActive: true };
const issued = {
  accessToken: 'access',
  refreshToken: 'refresh',
  refreshExpiresAt: new Date(Date.now() + 60_000),
};
const meta = { userAgent: 'jest', ip: '127.0.0.1' };

describe('AuthService', () => {
  const commandBus = { execute: jest.fn() };
  const queryBus = { execute: jest.fn() };
  const passwords = { hash: jest.fn(), verify: jest.fn(), verifyDummy: jest.fn() };
  const tokens = {
    refreshTtlSec: 3600,
    issue: jest.fn(),
    verifyRefresh: jest.fn(),
    hash: jest.fn((token: string) => `sha:${token}`),
  };
  const sessions = {
    create: jest.fn(),
    findActive: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };

  const service = new AuthService(
    commandBus as unknown as CommandBus,
    queryBus as unknown as QueryBus,
    passwords as unknown as PasswordService,
    tokens as unknown as TokensService,
    sessions as unknown as SessionsRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    tokens.issue.mockResolvedValue(issued);
    sessions.create.mockResolvedValue({ id: 'session-1' });
  });

  describe('register', () => {
    it('хеширует пароль, создаёт пользователя через CommandBus и открывает сессию', async () => {
      passwords.hash.mockResolvedValueOnce('new-hash');
      commandBus.execute.mockResolvedValueOnce(user);

      const result = await service.register(
        {
          firstName: 'Иван',
          lastName: 'Петров',
          email: user.email,
          password: 'secret123',
          acceptTerms: true,
        },
        meta,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateUserCommand({
          firstName: 'Иван',
          lastName: 'Петров',
          email: user.email,
          passwordHash: 'new-hash',
          termsAcceptedAt: expect.any(Date) as Date,
        }),
      );
      expect(sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: user.id, ...meta }),
      );
      expect(sessions.rotate).toHaveBeenCalledWith(
        'session-1',
        'sha:refresh',
        issued.refreshExpiresAt,
      );
      expect(result).toEqual({ user, tokens: issued });
    });

    it('пробрасывает 409, если email занят', async () => {
      passwords.hash.mockResolvedValueOnce('new-hash');
      commandBus.execute.mockRejectedValueOnce(new ConflictException());

      await expect(
        service.register(
          {
            firstName: 'Иван',
            lastName: 'Петров',
            email: user.email,
            password: 'secret123',
            acceptTerms: true,
          },
          meta,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(sessions.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('успешно логинит и фиксирует время входа', async () => {
      queryBus.execute.mockResolvedValueOnce(credentials).mockResolvedValueOnce(user);
      passwords.verify.mockResolvedValueOnce(true);

      const result = await service.login({ email: user.email, password: 'secret123' }, meta);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetUserCredentialsQuery({ email: user.email }),
      );
      expect(commandBus.execute).toHaveBeenCalledWith(new RecordUserLoginCommand(user.id));
      expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByIdQuery(user.id));
      expect(result.user).toEqual(user);
    });

    it('неверный пароль и несуществующий email дают одинаковую 401', async () => {
      queryBus.execute.mockResolvedValueOnce(credentials);
      passwords.verify.mockResolvedValueOnce(false);
      const wrongPassword = await service
        .login({ email: user.email, password: 'wrong' }, meta)
        .catch((e: unknown) => e);

      queryBus.execute.mockResolvedValueOnce(null);
      const unknownEmail = await service
        .login({ email: 'nobody@example.com', password: 'wrong' }, meta)
        .catch((e: unknown) => e);

      expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
      expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
      expect((wrongPassword as Error).message).toBe((unknownEmail as Error).message);
      expect(passwords.verifyDummy).toHaveBeenCalledTimes(1);
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('не пускает деактивированного пользователя', async () => {
      queryBus.execute.mockResolvedValueOnce({ ...credentials, isActive: false });
      passwords.verify.mockResolvedValueOnce(true);

      await expect(
        service.login({ email: user.email, password: 'secret123' }, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const payload = { sub: user.id, sid: 'session-1' };

    it('ротирует токены при совпадении хеша', async () => {
      tokens.verifyRefresh.mockResolvedValueOnce(payload);
      sessions.findActive.mockResolvedValueOnce({
        id: 'session-1',
        userId: user.id,
        tokenHash: 'sha:old',
      });

      await expect(service.refresh('old')).resolves.toEqual(issued);
      expect(sessions.rotate).toHaveBeenCalledWith(
        'session-1',
        'sha:refresh',
        issued.refreshExpiresAt,
      );
    });

    it('при повторном использовании старого токена отзывает все сессии', async () => {
      tokens.verifyRefresh.mockResolvedValueOnce(payload);
      sessions.findActive.mockResolvedValueOnce({
        id: 'session-1',
        userId: user.id,
        tokenHash: 'sha:newer',
      });

      await expect(service.refresh('old')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessions.revokeAllForUser).toHaveBeenCalledWith(user.id);
      expect(sessions.rotate).not.toHaveBeenCalled();
    });

    it('отклоняет невалидную подпись и отсутствующий токен', async () => {
      tokens.verifyRefresh.mockRejectedValueOnce(new Error('invalid signature'));
      await expect(service.refresh('garbage')).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('отзывает сессию из refresh-токена', async () => {
      tokens.verifyRefresh.mockResolvedValueOnce({ sub: user.id, sid: 'session-1' });
      await service.logout('refresh');
      expect(sessions.revoke).toHaveBeenCalledWith('session-1');
    });

    it('не падает на невалидном токене', async () => {
      tokens.verifyRefresh.mockRejectedValueOnce(new Error('expired'));
      await expect(service.logout('expired')).resolves.toBeUndefined();
      expect(sessions.revoke).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const auth = { userId: user.id, sessionId: 'session-1' };
    const input = { currentPassword: 'secret123', newPassword: 'secret456' };

    it('при неверном текущем пароле бросает 400 и ничего не меняет', async () => {
      queryBus.execute.mockResolvedValueOnce(credentials);
      passwords.verify.mockResolvedValueOnce(false);

      await expect(service.changePassword(auth, input)).rejects.toBeInstanceOf(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
    });

    it('меняет пароль, отзывает остальные сессии и ротирует текущую', async () => {
      queryBus.execute.mockResolvedValueOnce(credentials);
      passwords.verify.mockResolvedValueOnce(true);
      passwords.hash.mockResolvedValueOnce('new-hash');

      await expect(service.changePassword(auth, input)).resolves.toEqual(issued);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new ChangeUserPasswordCommand(user.id, 'new-hash'),
      );
      expect(sessions.revokeAllForUser).toHaveBeenCalledWith(user.id, 'session-1');
      expect(sessions.rotate).toHaveBeenCalledWith(
        'session-1',
        'sha:refresh',
        issued.refreshExpiresAt,
      );
    });
  });
});
