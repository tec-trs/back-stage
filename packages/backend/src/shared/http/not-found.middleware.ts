import type { Request, Response } from 'express';

export function notFoundMiddleware(request: Request, response: Response): void {
  response.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Rota nao encontrada: ${request.method} ${request.path}`,
    },
  });
}
