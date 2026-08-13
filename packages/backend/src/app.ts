import compression from 'compression';
import cors from 'cors';
import express, { type Express, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { openapiSpec } from './docs/openapi.js';
import { registerAuditModule } from './modules/audit/audit.module.js';
import { registerAuthModule } from './modules/auth/auth.module.js';
import { registerCatalogModule } from './modules/catalog/catalog.module.js';
import { registerDeploymentsModule } from './modules/deployments/deployments.module.js';
import { registerGovernanceModule } from './modules/governance/governance.module.js';
import { registerHealthModule } from './modules/health/health.module.js';
import { registerSearchModule } from './modules/search/search.module.js';
import { registerServiceCatalogModule } from './modules/service-catalog/service-catalog.module.js';
import { metricsRegistry } from './observability/metrics.js';
import { errorHandlerMiddleware } from './shared/http/error-handler.middleware.js';
import { metricsMiddleware } from './shared/http/metrics.middleware.js';
import { createMorganMiddleware } from './shared/http/morgan.middleware.js';
import { notFoundMiddleware } from './shared/http/not-found.middleware.js';
import { requestIdMiddleware } from './shared/http/request-id.middleware.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(compression());
  app.use(
    express.json({
      verify: (request, _response, buffer) => {
        (request as Request).rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(createMorganMiddleware());
  app.use(metricsMiddleware);
  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      limit: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/metrics', (_request, response) => {
    metricsRegistry
      .metrics()
      .then((body) => {
        response.set('Content-Type', metricsRegistry.contentType);
        response.status(200).send(body);
      })
      .catch((error: unknown) => {
        response.status(500).json({
          error: { code: 'METRICS_ERROR', message: String(error) },
        });
      });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.use('/api', registerHealthModule());
  app.use('/api/auth', registerAuthModule());
  app.use('/api/services', registerServiceCatalogModule());
  app.use('/api/governance', registerGovernanceModule());
  app.use('/api', registerSearchModule());
  app.use('/api/catalog-entities', registerCatalogModule());
  app.use('/api/audit-logs', registerAuditModule());
  app.use(registerDeploymentsModule());

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
