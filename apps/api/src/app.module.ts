import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { validateEnv } from './config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    CqrsModule.forRoot(),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
