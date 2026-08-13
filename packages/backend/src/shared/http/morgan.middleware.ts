import morgan from 'morgan';

import { logger } from '../../config/logger.js';

morgan.token('request-id', (request) => (request as { requestId?: string }).requestId ?? '-');

const stream: { write: (message: string) => void } = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

export function createMorganMiddleware(): ReturnType<typeof morgan> {
  return morgan(':method :url :status :res[content-length] - :response-time ms [:request-id]', {
    stream,
  });
}
