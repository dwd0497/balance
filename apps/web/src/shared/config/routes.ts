export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  profile: '/profile',
  /** Статические документы из `public/` */
  userAgreement: '/user-agreement.pdf',
  privacyPolicy: '/privacy-policy.pdf',
} as const;

/** Параметр возврата после входа. */
export const NEXT_PARAM = 'next';

/** Пропускает только внутренние пути, чтобы `?next=` нельзя было использовать для open redirect. */
export function safeNext(next: string | null | undefined): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : null;
}

/** Ссылка на гостевую страницу с сохранением пути возврата. */
export function withNext(path: string, next: string | null | undefined): string {
  const target = safeNext(next);
  return target ? `${path}?${NEXT_PARAM}=${encodeURIComponent(target)}` : path;
}
