import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';
import {
  RegisteredRelationship,
  type RegisteredRelationshipRow,
  RelationshipRegistration,
  type RelationshipRegistrationRow,
} from '../domain/relationship-registration.entity.js';

const REGISTRATIONS_TABLE = 'relationship_registrations';
const RELATIONSHIPS_TABLE = 'registered_relationships';

export interface AddRelationshipInput {
  sourceType: string;
  sourceId: string;
  sourceLabel: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  relationType: string;
  reason?: string | null;
}

export class RelationshipRegistrationRepository {
  public constructor(private readonly db: Knex) {}

  private async countRelationships(registrationIds: string[]): Promise<Map<string, number>> {
    if (registrationIds.length === 0) {
      return new Map();
    }

    const rows = (await this.db(RELATIONSHIPS_TABLE)
      .whereIn('registration_id', registrationIds)
      .whereNull('deleted_at')
      .groupBy('registration_id')
      .select('registration_id')
      .count<{ registration_id: string; count: string }[]>('* as count')) as {
      registration_id: string;
      count: string;
    }[];

    return new Map(rows.map((row) => [row.registration_id, Number(row.count)]));
  }

  public async findByName(name: string): Promise<RelationshipRegistration | undefined> {
    const row = (await this.db(REGISTRATIONS_TABLE)
      .where('organization_id', orgContext.getOrThrow())
      .whereRaw('lower(name) = lower(?)', [name])
      .whereNull('deleted_at')
      .first()) as RelationshipRegistrationRow | undefined;

    return row ? new RelationshipRegistration(row, 0) : undefined;
  }

  public async findAllByOrganization(): Promise<RelationshipRegistration[]> {
    const rows = (await this.db(REGISTRATIONS_TABLE)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at')
      .orderBy('name', 'asc')) as RelationshipRegistrationRow[];

    const counts = await this.countRelationships(rows.map((row) => row.id));

    return rows.map((row) => new RelationshipRegistration(row, counts.get(row.id) ?? 0));
  }

  public async findById(id: string): Promise<RelationshipRegistration | undefined> {
    const row = (await this.db(REGISTRATIONS_TABLE)
      .where('id', id)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at')
      .first()) as RelationshipRegistrationRow | undefined;

    if (!row) {
      return undefined;
    }

    const counts = await this.countRelationships([row.id]);
    return new RelationshipRegistration(row, counts.get(row.id) ?? 0);
  }

  public async findByIdWithRelationships(id: string): Promise<
    { registration: RelationshipRegistration; relationships: RegisteredRelationship[] } | undefined
  > {
    const row = (await this.db(REGISTRATIONS_TABLE)
      .where('id', id)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at')
      .first()) as RelationshipRegistrationRow | undefined;

    if (!row) {
      return undefined;
    }

    const relationshipRows = (await this.db(RELATIONSHIPS_TABLE)
      .where('registration_id', id)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')) as RegisteredRelationshipRow[];

    return {
      registration: new RelationshipRegistration(row, relationshipRows.length),
      relationships: relationshipRows.map((r) => new RegisteredRelationship(r)),
    };
  }

  public async create(name: string, description: string | null): Promise<RelationshipRegistration> {
    const [row] = (await this.db(REGISTRATIONS_TABLE)
      .insert({
        organization_id: orgContext.getOrThrow(),
        name,
        description,
      })
      .returning('*')) as RelationshipRegistrationRow[];

    return new RelationshipRegistration(row, 0);
  }

  public async update(
    id: string,
    updates: { name?: string; description?: string | null },
  ): Promise<RelationshipRegistration | undefined> {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;

    if (Object.keys(updateData).length > 0) {
      await this.db(REGISTRATIONS_TABLE)
        .where('id', id)
        .where('organization_id', orgContext.getOrThrow())
        .update(updateData);
    }

    return this.findById(id);
  }

  public async softDelete(id: string): Promise<boolean> {
    const now = this.db.fn.now();
    const affected = await this.db(REGISTRATIONS_TABLE)
      .where('id', id)
      .where('organization_id', orgContext.getOrThrow())
      .update({ deleted_at: now });

    if (affected > 0) {
      await this.db(RELATIONSHIPS_TABLE).where('registration_id', id).update({ deleted_at: now });
    }

    return affected > 0;
  }

  public async addRelationship(
    registrationId: string,
    input: AddRelationshipInput,
  ): Promise<RegisteredRelationship> {
    const [row] = (await this.db(RELATIONSHIPS_TABLE)
      .insert({
        registration_id: registrationId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        source_label: input.sourceLabel,
        target_type: input.targetType,
        target_id: input.targetId,
        target_label: input.targetLabel,
        relation_type: input.relationType,
        reason: input.reason ?? null,
      })
      .returning('*')) as RegisteredRelationshipRow[];

    return new RegisteredRelationship(row);
  }

  public async removeRelationship(relationshipId: string): Promise<boolean> {
    const affected = await this.db(RELATIONSHIPS_TABLE)
      .where('id', relationshipId)
      .update({ deleted_at: this.db.fn.now() });

    return affected > 0;
  }
}
