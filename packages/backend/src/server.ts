import type { Server } from 'node:http';

import type { Express } from 'express';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { closeDatabaseConnection } from './database/connection.js';

export interface RunningServer {
  app: Express;
  httpServer: Server;
}

export function startServer(): RunningServer {
  const app = createApp();

  const httpServer = app.listen(env.port, () => {
    logger.info(`Backend disponivel em http://localhost:${env.port}`);
  });

  function shutdown(signal: string): void {
    logger.info(`Sinal ${signal} recebido, encerrando servidor...`);
    httpServer.close((error) => {
      void closeDatabaseConnection().finally(() => {
        if (error) {
          logger.error('Erro ao encerrar o servidor', { error });
          process.exit(1);
        }
        process.exit(0);
      });
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    process.exit(1);
  });

  return { app, httpServer };
}
