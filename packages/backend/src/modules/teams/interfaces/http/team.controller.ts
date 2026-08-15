import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { TeamService } from '../../application/team.service.js';
import type {
  addMemberBodySchema,
  createTeamBodySchema,
  updateMemberRoleBodySchema,
  updateTeamBodySchema,
} from './team.validation.js';

type CreateBody = z.infer<typeof createTeamBodySchema>;
type UpdateBody = z.infer<typeof updateTeamBodySchema>;
type AddMemberBody = z.infer<typeof addMemberBodySchema>;
type UpdateRoleBody = z.infer<typeof updateMemberRoleBodySchema>;

function audit(request: Request) {
  return {
    actorUserId: request.user?.id,
    ipAddress: request.ip,
    userAgent: request.header('user-agent'),
  };
}

export class TeamController {
  constructor(private readonly service: TeamService) {}

  list = async (_request: Request, response: Response): Promise<void> => {
    const items = await this.service.list();
    response.status(200).json({ items: items.map((t) => t.toJSON()) });
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const team = await this.service.getById(request.params.id);
    response.status(200).json(team.toJSON());
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateBody;
    const team = await this.service.create(body, audit(request));
    response.status(201).json(team.toJSON());
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateBody;
    const team = await this.service.update(request.params.id, body, audit(request));
    response.status(200).json(team.toJSON());
  };

  remove = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(request.params.id, audit(request));
    response.status(204).send();
  };

  addMember = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as AddMemberBody;
    const team = await this.service.addMember(
      request.params.id,
      body.userId,
      body.role,
      audit(request),
    );
    response.status(200).json(team.toJSON());
  };

  removeMember = async (request: Request, response: Response): Promise<void> => {
    const team = await this.service.removeMember(
      request.params.id,
      request.params.userId,
      audit(request),
    );
    response.status(200).json(team.toJSON());
  };

  updateMemberRole = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateRoleBody;
    const team = await this.service.updateMemberRole(
      request.params.id,
      request.params.userId,
      body.role,
      audit(request),
    );
    response.status(200).json(team.toJSON());
  };
}
