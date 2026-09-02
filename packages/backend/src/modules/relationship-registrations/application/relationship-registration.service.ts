import { ConflictError, NotFoundError } from '@back-stage/shared';

import type { RegisteredRelationship, RelationshipRegistration } from '../domain/relationship-registration.entity.js';
import type {
  AddRelationshipInput,
  RelationshipRegistrationRepository,
} from '../infrastructure/relationship-registration.repository.js';

export interface CreateRelationshipRegistrationInput {
  name: string;
  description?: string | null;
}

export interface UpdateRelationshipRegistrationInput {
  name?: string;
  description?: string | null;
}

export class RelationshipRegistrationService {
  public constructor(private readonly repository: RelationshipRegistrationRepository) {}

  public async list(): Promise<RelationshipRegistration[]> {
    return this.repository.findAllByOrganization();
  }

  public async getByIdWithRelationships(id: string): Promise<{
    registration: RelationshipRegistration;
    relationships: RegisteredRelationship[];
  }> {
    const result = await this.repository.findByIdWithRelationships(id);
    if (!result) {
      throw new NotFoundError('Cadastro de relacionamento', id);
    }
    return result;
  }

  public async create(input: CreateRelationshipRegistrationInput): Promise<RelationshipRegistration> {
    const name = input.name.trim();
    const existing = await this.repository.findByName(name);
    if (existing) {
      throw new ConflictError(`Ja existe um cadastro de relacionamento chamado '${name}'`);
    }

    return this.repository.create(name, input.description?.trim() || null);
  }

  public async update(
    id: string,
    input: UpdateRelationshipRegistrationInput,
  ): Promise<RelationshipRegistration> {
    if (input.name !== undefined) {
      const name = input.name.trim();
      const existing = await this.repository.findByName(name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Ja existe um cadastro de relacionamento chamado '${name}'`);
      }
    }

    const updated = await this.repository.update(id, {
      name: input.name?.trim(),
      description: input.description !== undefined ? input.description?.trim() || null : undefined,
    });
    if (!updated) {
      throw new NotFoundError('Cadastro de relacionamento', id);
    }
    return updated;
  }

  public async delete(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Cadastro de relacionamento', id);
    }
  }

  public async addRelationship(
    registrationId: string,
    input: AddRelationshipInput,
  ): Promise<RegisteredRelationship> {
    const registration = await this.repository.findById(registrationId);
    if (!registration) {
      throw new NotFoundError('Cadastro de relacionamento', registrationId);
    }

    return this.repository.addRelationship(registrationId, {
      ...input,
      sourceLabel: input.sourceLabel || input.sourceId,
      targetLabel: input.targetLabel || input.targetId,
    });
  }

  public async removeRelationship(registrationId: string, relationshipId: string): Promise<void> {
    const registration = await this.repository.findById(registrationId);
    if (!registration) {
      throw new NotFoundError('Cadastro de relacionamento', registrationId);
    }

    const removed = await this.repository.removeRelationship(relationshipId);
    if (!removed) {
      throw new NotFoundError('Relacionamento', relationshipId);
    }
  }
}
