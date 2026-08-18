import { ConflictError, NotFoundError } from '@back-stage/shared';

import type { Organization } from '../domain/organization.entity.js';
import type {
  CreateOrganizationInput,
  IOrganizationRepository,
  UpdateOrganizationInput,
} from '../infrastructure/organization.repository.js';

export class OrganizationService {
  public constructor(private readonly repo: IOrganizationRepository) {}

  public async list(): Promise<Organization[]> {
    return this.repo.findAll();
  }

  public async getById(id: string): Promise<Organization> {
    const org = await this.repo.findById(id);
    if (!org) throw new NotFoundError('Organizacao', id);
    return org;
  }

  public async create(input: CreateOrganizationInput): Promise<Organization> {
    const existing = await this.repo.findBySlug(input.slug);
    if (existing) throw new ConflictError(`Ja existe uma organizacao com o slug '${input.slug}'`);
    return this.repo.create(input);
  }

  public async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    await this.getById(id);
    const org = await this.repo.update(id, input);
    if (!org) throw new NotFoundError('Organizacao', id);
    return org;
  }

  public async delete(id: string): Promise<void> {
    const org = await this.getById(id);
    if (org.slug === 'default') {
      throw new ConflictError('A organizacao padrao nao pode ser removida');
    }
    const deleted = await this.repo.softDelete(id);
    if (!deleted) throw new NotFoundError('Organizacao', id);
  }
}
