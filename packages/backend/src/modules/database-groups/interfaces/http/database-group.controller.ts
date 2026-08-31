import type { Request, Response } from 'express';
import type { z } from 'zod';

import { orgContext } from '../../../../shared/context/org-context.js';
import type { DatabaseGroupService } from '../../application/database-group.service.js';
import type {
  addApplicationLinkSchema,
  addMemberSchema,
  createDatabaseGroupSchema,
  groupApplicationLinkParamSchema,
  groupIdParamSchema,
  groupMemberParamSchema,
  updateDatabaseGroupSchema,
} from './database-group.validation.js';

type CreateGroupBody = z.infer<typeof createDatabaseGroupSchema>;
type UpdateGroupBody = z.infer<typeof updateDatabaseGroupSchema>;
type AddMemberBody = z.infer<typeof addMemberSchema>;
type AddApplicationLinkBody = z.infer<typeof addApplicationLinkSchema>;
type GroupIdParam = z.infer<typeof groupIdParamSchema>;
type GroupMemberParam = z.infer<typeof groupMemberParamSchema>;
type GroupApplicationLinkParam = z.infer<typeof groupApplicationLinkParamSchema>;

export class DatabaseGroupController {
  public constructor(private readonly service: DatabaseGroupService) {}

  public listGroups = async (_request: Request, response: Response): Promise<void> => {
    const orgId = orgContext.getOrThrow();
    const groups = await this.service.listGroups(orgId);
    response.status(200).json({ items: groups });
  };

  public getGroup = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupIdParam;
    const orgId = orgContext.getOrThrow();

    const detail = await this.service.getGroupDetail(params.groupId, orgId);
    response.status(200).json(detail);
  };

  public createGroup = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateGroupBody;
    const orgId = orgContext.getOrThrow();

    const group = await this.service.createGroup(orgId, request.user?.id ?? null, body);
    response.status(201).json(group);
  };

  public updateGroup = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupIdParam;
    const body = request.body as UpdateGroupBody;
    const orgId = orgContext.getOrThrow();

    const group = await this.service.updateGroup(params.groupId, orgId, body);
    response.status(200).json(group);
  };

  public deleteGroup = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupIdParam;
    const orgId = orgContext.getOrThrow();

    await this.service.deleteGroup(params.groupId, orgId);
    response.status(204).send();
  };

  public addMember = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupIdParam;
    const body = request.body as AddMemberBody;
    const orgId = orgContext.getOrThrow();

    const detail = await this.service.addMember(params.groupId, orgId, body.databaseId);
    response.status(201).json(detail);
  };

  public removeMember = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupMemberParam;
    const orgId = orgContext.getOrThrow();

    const detail = await this.service.removeMember(params.groupId, orgId, params.memberId);
    response.status(200).json(detail);
  };

  public addApplicationLink = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupIdParam;
    const body = request.body as AddApplicationLinkBody;
    const orgId = orgContext.getOrThrow();

    const detail = await this.service.addApplicationLink(params.groupId, orgId, body.applicationId);
    response.status(201).json(detail);
  };

  public removeApplicationLink = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupApplicationLinkParam;
    const orgId = orgContext.getOrThrow();

    const detail = await this.service.removeApplicationLink(params.groupId, orgId, params.linkId);
    response.status(200).json(detail);
  };
}
