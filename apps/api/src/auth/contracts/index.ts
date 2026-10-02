// Публичный API модуля auth для остальных модулей.
export type { AuthUser } from '../auth.types';
export { CurrentUser } from '../decorators/current-user.decorator';
export { Public } from '../decorators/public.decorator';
