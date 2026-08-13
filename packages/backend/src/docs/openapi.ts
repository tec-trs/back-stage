import swaggerJsdoc from 'swagger-jsdoc';

import { env } from '../config/env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Platform Engineering Center API',
      version: '0.1.0',
      description: 'API do back-stage: Service Catalog, Governance, Search, Audit e mais',
    },
    servers: [{ url: `http://localhost:${env.port}/api` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    './src/modules/**/interfaces/http/*.routes.ts',
    './dist/modules/**/interfaces/http/*.routes.js',
  ],
};

export const openapiSpec = swaggerJsdoc(options);
