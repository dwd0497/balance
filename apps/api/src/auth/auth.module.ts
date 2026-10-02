import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthCookiesService } from './auth-cookies.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordService } from './password.service';
import { SessionsRepository } from './sessions.repository';
import { TokensService } from './tokens.service';

/** С модулем users общается только через CQRS-шины (см. `users/contracts`). */
@Module({
  // секреты и TTL передаются в TokensService при каждой подписи
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCookiesService,
    PasswordService,
    SessionsRepository,
    TokensService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
