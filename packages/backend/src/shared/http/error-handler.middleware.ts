import { BaseError } from '@back-stage/shared';
import type { NextFunction, Request, Response } from 'express';

import { logger } from '../../config/logger.js';

export function errorHandlerMiddleware(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof BaseError) {
    logger.warn(`${error.code}: ${error.message}`, {
      path: request.path,
      method: request.method,
    });
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  const unexpectedError = error instanceof Error ? error : new Error('Erro desconhecido');
  logger.error(unexpectedError.message, {
    stack: unexpectedError.stack,
    path: request.path,
    method: request.method,
  });

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
    },
  });
}
