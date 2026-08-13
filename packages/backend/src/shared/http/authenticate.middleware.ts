import { UnauthorizedError } from '@back-stage/shared';
import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '../auth/jwt.js';

const BEARER_PREFIX = 'Bearer ';

export function authenticateMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const authorizationHeader = request.header('authorization');

  if (!authorizationHeader || !authorizationHeader.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedError('Token de acesso ausente'));
    return;
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length);

  try {
    request.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Token de acesso invalido ou expirado'));
  }
}
