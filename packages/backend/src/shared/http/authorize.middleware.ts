import { ForbiddenError, UnauthorizedError } from '@back-stage/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function authorizeMiddleware(...allowedRoles: string[]): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user) {
      next(new UnauthorizedError());
      return;
    }

    const hasRole = request.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      next(new ForbiddenError('Voce nao tem permissao para executar esta acao'));
      return;
    }

    next();
  };
}
