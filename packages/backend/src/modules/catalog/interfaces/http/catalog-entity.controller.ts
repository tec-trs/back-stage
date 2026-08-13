import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { CatalogEntityService } from '../../application/catalog-entity.service.js';

import type { listCatalogEntitiesQuerySchema } from './catalog-entity.validation.js';

type ListCatalogEntitiesQuery = z.infer<typeof listCatalogEntitiesQuerySchema>;

export class CatalogEntityController {
  public constructor(private readonly catalogEntityService: CatalogEntityService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListCatalogEntitiesQuery;
    const result = await this.catalogEntityService.list(
      { kind: query.kind, lifecycle: query.lifecycle, namespace: query.namespace },
      { page: query.page, pageSize: query.pageSize },
    );
    response.status(200).json(result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const entity = await this.catalogEntityService.getById(request.params.id);
    response.status(200).json(entity);
  };
}
