import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { ACCESS_COOKIE } from './auth/auth-cookies.service';
import type { Env } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.use(cookieParser());
  app.enableCors({ origin: config.get('CORS_ORIGIN', { infer: true }), credentials: true });
  app.enableShutdownHooks();

  const openApi = new DocumentBuilder()
    .setTitle('Balance API')
    .setDescription('Трекер расходов на ремонт квартиры')
    .setVersion('0.1.0')
    .addCookieAuth(ACCESS_COOKIE)
    .build();
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(SwaggerModule.createDocument(app, openApi)));

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
