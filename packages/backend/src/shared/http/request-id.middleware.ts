import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import { runWithRequestContext } from '../context/request-context.js';

const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const incomingId = request.header(REQUEST_ID_HEADER);
  const requestId = incomingId && incomingId.length > 0 ? incomingId : randomUUID();

  request.requestId = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);

  runWithRequestContext({ requestId }, () => next());
}
