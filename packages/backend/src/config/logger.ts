import winston from 'winston';

import { getRequestId } from '../shared/context/request-context.js';

import { env } from './env.js';

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

const injectRequestId = winston.format((info) => {
  const requestId = getRequestId();
  if (requestId) {
    info.requestId = requestId;
  }
  return info;
});

const developmentFormat = combine(
  injectRequestId(),
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, requestId, ...meta }) => {
    const idPart = requestId ? ` [${String(requestId)}]` : '';
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${String(ts)}${idPart} [${level}]: ${String(stack ?? message)}${metaString}`;
  }),
);

const productionFormat = combine(injectRequestId(), timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.logLevel,
  format: env.nodeEnv === 'production' ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});
