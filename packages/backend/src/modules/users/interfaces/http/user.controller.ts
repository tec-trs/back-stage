import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { UserService } from '../../application/user.service.js';

import type {
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
} from './user.validation.js';

type CreateUserBody = z.infer<typeof createUserBodySchema>;
type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export class UserController {
  public constructor(private readonly userService: UserService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListUsersQuery;

    const result = await this.userService.list(
      { isActive: query.isActive, search: query.search },
      { page: query.page, pageSize: query.pageSize },
    );

    response.status(200).json({
      items: result.items.map((item) => item.toJSON()),
      pagination: result.pagination,
    });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const user = await this.userService.getById(request.params.id);
    response.status(200).json(user.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateUserBody;
    const user = await this.userService.create(body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(user.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateUserBody;
    const user = await this.userService.update(request.params.id, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(user.toJSON());
  };

  public activate = async (request: Request, response: Response): Promise<void> => {
    const user = await this.userService.setActive(request.params.id, true, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(user.toJSON());
  };

  public deactivate = async (request: Request, response: Response): Promise<void> => {
    const user = await this.userService.setActive(request.params.id, false, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(user.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.userService.delete(request.params.id, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };
}
