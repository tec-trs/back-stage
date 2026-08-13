import { ConflictError, NotFoundError, ValidationError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import { hashPassword } from '../../../shared/auth/password.js';
import type { User } from '../domain/user.entity.js';
import type {
  IUserRepository,
  Pagination,
  UserFilters,
} from '../infrastructure/user.repository.js';

export interface ListUsersResult {
  items: User[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreateUserServiceInput {
  email: string;
  fullName: string;
  password: string;
  roles: string[];
}

export interface UpdateUserServiceInput {
  email?: string;
  fullName?: string;
  roles?: string[];
  password?: string;
}

export class UserService {
  public constructor(private readonly userRepository: IUserRepository) {}

  public async list(filters: UserFilters, pagination: Pagination): Promise<ListUsersResult> {
    const { items, total } = await this.userRepository.findMany(filters, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario', id);
    }
    return user;
  }

  public async create(input: CreateUserServiceInput, audit: AuditContext): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError(`Ja existe um usuario com o email '${input.email}'`);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      roles: input.roles,
    });

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'user.created',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { email: user.email },
    });

    return user;
  }

  public async update(
    id: string,
    input: UpdateUserServiceInput,
    audit: AuditContext,
  ): Promise<User> {
    await this.getById(id);

    if (input.email !== undefined) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Ja existe um usuario com o email '${input.email}'`);
      }
    }

    const passwordHash =
      input.password !== undefined ? await hashPassword(input.password) : undefined;

    const updated = await this.userRepository.update(id, {
      email: input.email,
      fullName: input.fullName,
      roles: input.roles,
      passwordHash,
    });
    if (!updated) {
      throw new NotFoundError('Usuario', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'user.updated',
      resourceType: 'user',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { changes: { email: input.email, fullName: input.fullName, roles: input.roles } },
    });

    return updated;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    await this.getById(id);

    if (audit.actorUserId === id) {
      throw new ValidationError('Voce nao pode eliminar sua propria conta');
    }

    const deleted = await this.userRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Usuario', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'user.deleted',
      resourceType: 'user',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  }

  public async setActive(id: string, isActive: boolean, audit: AuditContext): Promise<User> {
    await this.getById(id);

    if (!isActive && audit.actorUserId === id) {
      throw new ValidationError('Voce nao pode inativar sua propria conta');
    }

    const updated = await this.userRepository.setActive(id, isActive);
    if (!updated) {
      throw new NotFoundError('Usuario', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: isActive ? 'user.activated' : 'user.deactivated',
      resourceType: 'user',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return updated;
  }
}
