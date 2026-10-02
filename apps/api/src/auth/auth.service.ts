import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { ChangePasswordInput, LoginInput, PublicUser, RegisterInput } from '@balance/shared';
import {
  ChangeUserPasswordCommand,
  CreateUserCommand,
  GetUserByIdQuery,
  GetUserCredentialsQuery,
  RecordUserLoginCommand,
} from '../users/contracts';
import type { AuthTokens, AuthUser, SessionMeta } from './auth.types';
import { PasswordService } from './password.service';
import { SessionsRepository } from './sessions.repository';
import { TokensService } from './tokens.service';

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

const INVALID_CREDENTIALS = 'Неверный email или пароль';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly passwords: PasswordService,
    private readonly tokens: TokensService,
    private readonly sessions: SessionsRepository,
  ) {}

  async register(input: RegisterInput, meta: SessionMeta): Promise<AuthResult> {
    const { firstName, lastName, email, password } = input;
    const passwordHash = await this.passwords.hash(password);
    // acceptTerms === true гарантирует схема; фиксируем момент согласия
    const user = await this.commandBus.execute(
      new CreateUserCommand({
        firstName,
        lastName,
        email,
        passwordHash,
        termsAcceptedAt: new Date(),
      }),
    );
    return { user, tokens: await this.openSession(user.id, meta) };
  }

  async login(input: LoginInput, meta: SessionMeta): Promise<AuthResult> {
    const credentials = await this.queryBus.execute(
      new GetUserCredentialsQuery({ email: input.email }),
    );
    if (!credentials) {
      await this.passwords.verifyDummy(input.password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const valid = await this.passwords.verify(credentials.passwordHash, input.password);
    if (!valid || !credentials.isActive) throw new UnauthorizedException(INVALID_CREDENTIALS);

    await this.commandBus.execute(new RecordUserLoginCommand(credentials.id));
    const user = await this.me(credentials.id);
    return { user, tokens: await this.openSession(credentials.id, meta) };
  }

  /** Ротация refresh-токена. Повторное использование старого токена отзывает все сессии. */
  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    if (!refreshToken) throw new UnauthorizedException();
    const payload = await this.tokens.verifyRefresh(refreshToken).catch(() => {
      throw new UnauthorizedException();
    });

    const session = await this.sessions.findActive(payload.sid);
    if (!session || session.userId !== payload.sub) throw new UnauthorizedException();

    if (session.tokenHash !== this.tokens.hash(refreshToken)) {
      await this.sessions.revokeAllForUser(session.userId);
      throw new UnauthorizedException('Сессия скомпрометирована, войдите заново');
    }

    return this.rotateSession(session.userId, session.id);
  }

  /** Идемпотентно: невалидный или отсутствующий токен просто игнорируется. */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const payload = await this.tokens.verifyRefresh(refreshToken).catch(() => null);
    if (payload) await this.sessions.revoke(payload.sid);
  }

  async changePassword(auth: AuthUser, input: ChangePasswordInput): Promise<AuthTokens> {
    const credentials = await this.queryBus.execute(
      new GetUserCredentialsQuery({ userId: auth.userId }),
    );
    if (!credentials) throw new UnauthorizedException();

    // 400, а не 401: клиент не должен воспринимать это как истёкшую сессию
    const valid = await this.passwords.verify(credentials.passwordHash, input.currentPassword);
    if (!valid) throw new BadRequestException('Неверный текущий пароль');

    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.commandBus.execute(new ChangeUserPasswordCommand(auth.userId, passwordHash));
    await this.sessions.revokeAllForUser(auth.userId, auth.sessionId);
    return this.rotateSession(auth.userId, auth.sessionId);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async openSession(userId: string, meta: SessionMeta): Promise<AuthTokens> {
    // tokenHash заполняется сразу после выпуска токенов: для подписи нужен id сессии
    const session = await this.sessions.create({
      userId,
      tokenHash: '',
      expiresAt: new Date(Date.now() + this.tokens.refreshTtlSec * 1000),
      ...meta,
    });
    return this.rotateSession(userId, session.id);
  }

  private async rotateSession(userId: string, sessionId: string): Promise<AuthTokens> {
    const tokens = await this.tokens.issue(userId, sessionId);
    await this.sessions.rotate(
      sessionId,
      this.tokens.hash(tokens.refreshToken),
      tokens.refreshExpiresAt,
    );
    return tokens;
  }
}
