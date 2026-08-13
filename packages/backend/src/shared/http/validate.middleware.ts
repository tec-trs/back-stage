import { ValidationError } from '@back-stage/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    details[path] = [...(details[path] ?? []), issue.message];
  }

  return details;
}

export function validateMiddleware(schemas: ValidationSchemas): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(request.body);
      if (!result.success) {
        next(new ValidationError('Corpo da requisicao invalido', formatZodError(result.error)));
        return;
      }
      request.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(request.query);
      if (!result.success) {
        next(new ValidationError('Parametros de consulta invalidos', formatZodError(result.error)));
        return;
      }
      Object.assign(request.query, result.data);
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(request.params);
      if (!result.success) {
        next(new ValidationError('Parametros de rota invalidos', formatZodError(result.error)));
        return;
      }
      Object.assign(request.params, result.data);
    }

    next();
  };
}
