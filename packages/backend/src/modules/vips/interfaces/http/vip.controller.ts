import type { Request, Response } from 'express';
import type { z } from 'zod';

import { orgContext } from '../../../../shared/context/org-context.js';
import type { VIPService } from '../../application/vip.service.js';
import type {
  addServerSchema,
  createVIPSchema,
  updateVIPSchema,
  vipIdParamSchema,
  vipServerParamSchema,
} from './vip.validation.js';

type CreateVIPBody = z.infer<typeof createVIPSchema>;
type UpdateVIPBody = z.infer<typeof updateVIPSchema>;
type VIPIdParam = z.infer<typeof vipIdParamSchema>;
type VIPServerParam = z.infer<typeof vipServerParamSchema>;
type AddServerBody = z.infer<typeof addServerSchema>;

export class VIPController {
  public constructor(private readonly service: VIPService) {}

  public listVIPs = async (_request: Request, response: Response): Promise<void> => {
    const orgId = orgContext.getOrThrow();
    const vips = await this.service.listVIPs(orgId);
    response.status(200).json({ items: vips });
  };

  public getVIP = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as VIPIdParam;
    const orgId = orgContext.getOrThrow();

    const vip = await this.service.getVIP(params.id, orgId);
    response.status(200).json(vip);
  };

  public createVIP = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateVIPBody;
    const orgId = orgContext.getOrThrow();

    const vip = await this.service.createVIP(orgId, body);
    response.status(201).json(vip);
  };

  public updateVIP = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as VIPIdParam;
    const body = request.body as UpdateVIPBody;
    const orgId = orgContext.getOrThrow();

    const vip = await this.service.updateVIP(params.id, orgId, body);
    response.status(200).json(vip);
  };

  public deleteVIP = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as VIPIdParam;
    const orgId = orgContext.getOrThrow();

    await this.service.deleteVIP(params.id, orgId);
    response.status(204).send();
  };

  public getVIPServers = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as VIPIdParam;
    const orgId = orgContext.getOrThrow();

    const servers = await this.service.getVIPServers(params.id, orgId);
    response.status(200).json({ items: servers });
  };

  public addServer = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as VIPIdParam;
    const body = request.body as AddServerBody;
    const orgId = orgContext.getOrThrow();

    const vip = await this.service.addServerToVIP(params.id, orgId, body.serverId, body.order);
    response.status(201).json(vip);
  };

  public removeServer = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as VIPServerParam;
    const orgId = orgContext.getOrThrow();

    await this.service.removeServerFromVIP(params.id, orgId, params.serverId);
    response.status(204).send();
  };
}
