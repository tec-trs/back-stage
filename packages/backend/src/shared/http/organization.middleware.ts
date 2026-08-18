import { ForbiddenError } from '@back-stage/shared';
import type { NextFunction, Request, Response } from 'express';

import { orgContext } from '../context/org-context.js';

export function organizationMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const orgId = request.user?.organizationId;

  if (!orgId) {
    next(new ForbiddenError('Organizacao nao definida no token de acesso'));
    return;
  }

  request.organizationId = orgId;
  orgContext.run(orgId, () => next());
}
