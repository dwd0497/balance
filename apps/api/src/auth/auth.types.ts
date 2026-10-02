import type { Request } from 'express';

/** Аутентифицированный субъект запроса — кладётся guard'ом в `req.user`. */
export interface AuthUser {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}
