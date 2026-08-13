import type { AuthenticatedUser } from '../auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
      rawBody?: Buffer;
    }
  }
}

export {};
