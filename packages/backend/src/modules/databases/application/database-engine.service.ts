import { ConflictError, NotFoundError } from '@back-stage/shared';

import type { DatabaseEngine } from '../domain/database-engine.entity.js';
import type {
  CreateDatabaseEngineInput,
  IDatabaseEngineRepository,
  UpdateDatabaseEngineInput,
} from '../infrastructure/database-engine.repository.js';

export class DatabaseEngineService {
  public constructor(private readonly databaseEngineRepository: IDatabaseEngineRepository) {}

  public async findAll(): Promise<DatabaseEngine[]> {
    return this.databaseEngineRepository.findAll();
  }

  public async findActive(): Promise<DatabaseEngine[]> {
    return this.databaseEngineRepository.findActive();
  }

  public async getById(id: string): Promise<DatabaseEngine> {
    const engine = await this.databaseEngineRepository.findById(id);
    if (!engine) {
      throw new NotFoundError('Database engine', id);
    }
    return engine;
  }

  public async create(input: CreateDatabaseEngineInput): Promise<DatabaseEngine> {
    const existing = await this.databaseEngineRepository.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Ja existe um engine com o slug '${input.slug}'`);
    }

    return this.databaseEngineRepository.create(input);
  }

  public async update(id: string, input: UpdateDatabaseEngineInput): Promise<DatabaseEngine> {
    await this.getById(id);

    const updated = await this.databaseEngineRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Database engine', id);
    }

    return updated;
  }

  public async delete(id: string): Promise<void> {
    await this.getById(id);

    const deleted = await this.databaseEngineRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Database engine', id);
    }
  }
}
