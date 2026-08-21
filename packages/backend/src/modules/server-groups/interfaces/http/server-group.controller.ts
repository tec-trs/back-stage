import type { Request, Response } from 'express';
import type { z } from 'zod';

import { orgContext } from '../../../../shared/context/org-context.js';
import type { ServerGroupService } from '../../application/server-group.service.js';
import type {
  addGroupMemberSchema,
  createServerGroupSchema,
  groupIdParamSchema,
  memberParamSchema,
  updateServerGroupSchema,
} from './server-group.validation.js';

type CreateGroupBody = z.infer<typeof createServerGroupSchema>;
type UpdateGroupBody = z.infer<typeof updateServerGroupSchema>;
type GroupIdParam = z.infer<typeof groupIdParamSchema>;
type MemberParam = z.infer<typeof memberParamSchema>;
type AddMemberBody = z.infer<typeof addGroupMemberSchema>;

export class ServerGroupController {
  public constructor(private readonly service: ServerGroupService) {}

  public listGroups = async (_request: Request, response: Response): Promise<void> => {
    const orgId = orgContext.getOrThrow();
    const groups = await this.service.listGroups(orgId);

    response.status(200).json({ items: groups });
  };

  public getGroup = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupIdParam;
    const orgId = orgContext.getOrThrow();

    const group = await this.service.getGroup(params.groupId, orgId);
    response.status(200).json(group);
  };

  public createGroup = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateGroupBody;
    const orgId = orgContext.getOrThrow();

    const group = await this.service.createGroup(orgId, body);
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

  public getGroupMembers = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupIdParam;
    const orgId = orgContext.getOrThrow();

    const members = await this.service.getGroupMembers(params.groupId, orgId);
    response.status(200).json({ items: members });
  };

  public addMember = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GroupIdParam;
    const body = request.body as AddMemberBody;
    const orgId = orgContext.getOrThrow();

    const group = await this.service.addServerToGroup(params.groupId, orgId, body.serverId, body.order);
    response.status(201).json(group);
  };

  public removeMember = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as MemberParam;
    const orgId = orgContext.getOrThrow();

    await this.service.removeServerFromGroup(params.groupId, orgId, params.serverId);
    response.status(204).send();
  };
}
