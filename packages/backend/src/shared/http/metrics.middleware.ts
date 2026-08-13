import type { NextFunction, Request, Response } from 'express';

import {
  httpErrorsTotal,
  httpRequestDuration,
  httpRequestsTotal,
} from '../../observability/metrics.js';

export function metricsMiddleware(request: Request, response: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  response.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
    const route = request.route
      ? `${request.baseUrl}${request.route.path as string}`
      : request.path;
    const labels = {
      method: request.method,
      route,
      status_code: String(response.statusCode),
    };

    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);

    if (response.statusCode >= 500) {
      httpErrorsTotal.inc({ method: request.method, route });
    }
  });

  next();
}
