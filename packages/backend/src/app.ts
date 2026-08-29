import compression from 'compression';
import cors from 'cors';
import express, { type Express, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { openapiSpec } from './docs/openapi.js';
import { registerApplicationsModule } from './modules/applications/applications.module.js';
import { registerAuditModule } from './modules/audit/audit.module.js';
import { registerApplicationTypesModule } from './modules/application-types/application-types.module.js';
import { registerDatabasesModule } from './modules/databases/databases.module.js';
import { createDatabaseEngineRouter } from './modules/databases/interfaces/http/database-engine.routes.js';
import { DatabaseEngineController } from './modules/databases/interfaces/http/database-engine.controller.js';
import { DatabaseEngineService } from './modules/databases/application/database-engine.service.js';
import { DatabaseEngineRepository } from './modules/databases/infrastructure/database-engine.repository.js';
import { db } from './database/connection.js';
import { registerUrlsModule } from './modules/urls/urls.module.js';
import { registerResourceGraphModule } from './modules/resource-graph/resource-graph.module.js';
import { registerEnvironmentsModule } from './modules/environments/environments.module.js';
import { registerServerTypesModule } from './modules/server-types/server-types.module.js';
import { registerTeamsModule } from './modules/teams/teams.module.js';
import { registerAuthModule } from './modules/auth/auth.module.js';
import { registerOrganizationsModule } from './modules/organizations/organizations.module.js';
import { registerCatalogModule } from './modules/catalog/catalog.module.js';
import { registerDeploymentsModule } from './modules/deployments/deployments.module.js';
import { registerGovernanceModule } from './modules/governance/governance.module.js';
import { registerHealthModule } from './modules/health/health.module.js';
import { registerSearchModule } from './modules/search/search.module.js';
import { registerServersModule } from './modules/servers/servers.module.js';
import { registerVIPsModule } from './modules/vips/vips.module.js';
import { registerServerGroupsModule } from './modules/server-groups/server-groups.module.js';
import { registerRelationshipMapsModule } from './modules/relationship-maps/relationship-maps.module.js';
import { registerServiceCatalogModule } from './modules/service-catalog/service-catalog.module.js';
import { registerUsersModule } from './modules/users/users.module.js';
import { registerArchitectureModule } from './modules/architecture/architecture.module.js';
import { metricsRegistry } from './observability/metrics.js';
import { authenticateMiddleware } from './shared/http/authenticate.middleware.js';
import { errorHandlerMiddleware } from './shared/http/error-handler.middleware.js';
import { metricsMiddleware } from './shared/http/metrics.middleware.js';
import { createMorganMiddleware } from './shared/http/morgan.middleware.js';
import { notFoundMiddleware } from './shared/http/not-found.middleware.js';
import { organizationMiddleware } from './shared/http/organization.middleware.js';
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
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas requisicoes. Aguarde um momento e tente novamente.',
        },
      },
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
  app.use('/api/organizations', registerOrganizationsModule());
  app.use('/api/services', registerServiceCatalogModule());
  app.use('/api/governance', registerGovernanceModule());
  app.use('/api', registerSearchModule());
  app.use('/api/catalog-entities', registerCatalogModule());
  app.use('/api/audit-logs', registerAuditModule());
  app.use('/api/users', registerUsersModule());
  // Resource routes require authentication + organization context
  const withOrg = [authenticateMiddleware, organizationMiddleware];
  app.use('/api/environments', ...withOrg, registerEnvironmentsModule());
  app.use('/api/teams', ...withOrg, registerTeamsModule());
  app.use('/api/server-types', registerServerTypesModule());
  app.use('/api/application-types', registerApplicationTypesModule());
  app.use('/api/servers', ...withOrg, registerServersModule());
  app.use('/api/vips', ...withOrg, registerVIPsModule());
  app.use('/api/server-groups', ...withOrg, registerServerGroupsModule());
  app.use('/api/applications', ...withOrg, registerApplicationsModule());
  app.use('/api/database-engines', createDatabaseEngineRouter(
    new DatabaseEngineController(new DatabaseEngineService(new DatabaseEngineRepository(db))),
  ));
  app.use('/api/databases', ...withOrg, registerDatabasesModule());
  app.use('/api/urls', ...withOrg, registerUrlsModule());
  app.use('/api/resource-graph', ...withOrg, registerResourceGraphModule());
  app.use('/api/architecture-diagrams', ...withOrg, registerArchitectureModule(db).router);
  app.use('/api/relationship-maps', ...withOrg, registerRelationshipMapsModule());
  app.use(registerDeploymentsModule());

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
