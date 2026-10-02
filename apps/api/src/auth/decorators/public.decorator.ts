import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/** Отключает глобальный JwtAuthGuard для контроллера или метода. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
