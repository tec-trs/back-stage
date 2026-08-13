import type { Knex } from 'knex';

import {
  Application,
  ApplicationDeployment,
  type ApplicationDependencyRef,
  type ApplicationDeploymentRow,
  type ApplicationRow,
} from '../domain/application.entity.js';

const TABLE_NAME = 'applications';
const DEPLOYMENTS_TABLE_NAME = 'application_deployments';
const DEPENDENCIES_TABLE_NAME = 'application_dependencies';

export interface ApplicationFilters {
  status?: string;
  criticality?: string;
  appType?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface DeploymentInput {
  serverId: string;
  environment: string;
  deployMethod?: string | null;
  accessUrl?: string | null;
  ports?: string[];
  deployedVersion?: string | null;
}

export interface CreateApplicationInput {
  code: string;
  displayName: string;
  description?: string | null;
  appType: string;
  businessCategory?: string | null;
  criticality?: string;
  status?: string;
  language?: string | null;
  framework?: string | null;
  currentVersion?: string | null;
  repositoryUrl?: string | null;
  cicdUrl?: string | null;
  containerImage?: string | null;
  dataClassification?: string | null;
  authMethod?: string | null;
  ownerTeam?: string | null;
  ownerUserId?: string | null;
  costCenter?: string | null;
  monthlyCostEstimate?: number | null;
  docsUrl?: string | null;
  apiSpecUrl?: string | null;
  runbookUrl?: string | null;
  monitoringUrl?: string | null;
  sla?: string | null;
  healthCheckUrl?: string | null;
  metadata?: Record<string, unknown>;
  deployments?: DeploymentInput[];
  dependsOnIds?: string[];
}

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export interface IApplicationRepository {
  findMany(
    filters: ApplicationFilters,
    pagination: Pagination,
  ): Promise<{ items: Application[]; total: number }>;
  findById(id: string): Promise<Application | undefined>;
  findByCode(code: string): Promise<Application | undefined>;
  create(input: CreateApplicationInput): Promise<Application>;
  update(id: string, input: UpdateApplicationInput): Promise<Application | undefined>;
  setStatus(id: string, status: string): Promise<Application | undefined>;
  softDelete(id: string): Promise<boolean>;
}

export class ApplicationRepository implements IApplicationRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME).whereNull('deleted_at');
  }

  private async loadDeployments(applicationIds: string[]): Promise<Map<string, ApplicationDeployment[]>> {
    if (applicationIds.length === 0) {
      return new Map();
    }
    const rows = (await this.db(DEPLOYMENTS_TABLE_NAME)
      .select(
        `${DEPLOYMENTS_TABLE_NAME}.*`,
        `${'servers'}.hostname as server_hostname`,
      )
      .leftJoin('servers', 'servers.id', `${DEPLOYMENTS_TABLE_NAME}.server_id`)
      .whereIn(`${DEPLOYMENTS_TABLE_NAME}.application_id`, applicationIds)
      .whereNull(`${DEPLOYMENTS_TABLE_NAME}.deleted_at`)) as ApplicationDeploymentRow[];

    const map = new Map<string, ApplicationDeployment[]>();
    for (const row of rows) {
      const deployment = new ApplicationDeployment(row);
      const existing = map.get(row.application_id) ?? [];
      existing.push(deployment);
      map.set(row.application_id, existing);
    }
    return map;
  }

  private async loadDependencies(
    applicationIds: string[],
  ): Promise<{
    dependsOn: Map<string, ApplicationDependencyRef[]>;
    dependents: Map<string, ApplicationDependencyRef[]>;
  }> {
    if (applicationIds.length === 0) {
      return { dependsOn: new Map(), dependents: new Map() };
    }

    interface DependencyJoinRow {
      application_id: string;
      id: string;
      code: string;
      display_name: string;
    }

    const dependsOnRows = (await this.db(DEPENDENCIES_TABLE_NAME)
      .select(
        `${DEPENDENCIES_TABLE_NAME}.application_id`,
        `${TABLE_NAME}.id`,
        `${TABLE_NAME}.code`,
        `${TABLE_NAME}.display_name`,
      )
      .innerJoin(TABLE_NAME, `${TABLE_NAME}.id`, `${DEPENDENCIES_TABLE_NAME}.depends_on_application_id`)
      .whereIn(`${DEPENDENCIES_TABLE_NAME}.application_id`, applicationIds)
      .whereNull(`${DEPENDENCIES_TABLE_NAME}.deleted_at`)
      .whereNull(`${TABLE_NAME}.deleted_at`)) as DependencyJoinRow[];

    const dependentsRows = (await this.db(DEPENDENCIES_TABLE_NAME)
      .select(
        `${DEPENDENCIES_TABLE_NAME}.depends_on_application_id as application_id`,
        `${TABLE_NAME}.id`,
        `${TABLE_NAME}.code`,
        `${TABLE_NAME}.display_name`,
      )
      .innerJoin(TABLE_NAME, `${TABLE_NAME}.id`, `${DEPENDENCIES_TABLE_NAME}.application_id`)
      .whereIn(`${DEPENDENCIES_TABLE_NAME}.depends_on_application_id`, applicationIds)
      .whereNull(`${DEPENDENCIES_TABLE_NAME}.deleted_at`)
      .whereNull(`${TABLE_NAME}.deleted_at`)) as DependencyJoinRow[];

    const dependsOn = new Map<string, ApplicationDependencyRef[]>();
    for (const row of dependsOnRows) {
      const existing = dependsOn.get(row.application_id) ?? [];
      existing.push({ id: row.id, code: row.code, displayName: row.display_name });
      dependsOn.set(row.application_id, existing);
    }

    const dependents = new Map<string, ApplicationDependencyRef[]>();
    for (const row of dependentsRows) {
      const existing = dependents.get(row.application_id) ?? [];
      existing.push({ id: row.id, code: row.code, displayName: row.display_name });
      dependents.set(row.application_id, existing);
    }

    return { dependsOn, dependents };
  }

  private async hydrate(rows: ApplicationRow[]): Promise<Application[]> {
    const ids = rows.map((row) => row.id);
    const [deploymentsByApp, dependencies] = await Promise.all([
      this.loadDeployments(ids),
      this.loadDependencies(ids),
    ]);

    return rows.map(
      (row) =>
        new Application(
          row,
          deploymentsByApp.get(row.id) ?? [],
          dependencies.dependsOn.get(row.id) ?? [],
          dependencies.dependents.get(row.id) ?? [],
        ),
    );
  }

  public async findMany(
    filters: ApplicationFilters,
    pagination: Pagination,
  ): Promise<{ items: Application[]; total: number }> {
    const filteredQuery = this.db(TABLE_NAME).whereNull('deleted_at');

    if (filters.status) {
      filteredQuery.where('status', filters.status);
    }
    if (filters.criticality) {
      filteredQuery.where('criticality', filters.criticality);
    }
    if (filters.appType) {
      filteredQuery.where('app_type', filters.appType);
    }
    if (filters.search) {
      filteredQuery.where((builder) => {
        builder
          .whereILike('code', `%${filters.search}%`)
          .orWhereILike('display_name', `%${filters.search}%`);
      });
    }

    const countQuery = filteredQuery.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = filteredQuery
      .clone()
      .orderBy('display_name', 'asc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);
    const items = await this.hydrate(rows as ApplicationRow[]);

    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  public async findById(id: string): Promise<Application | undefined> {
    const row = (await this.baseQuery().where('id', id).first()) as ApplicationRow | undefined;
    if (!row) {
      return undefined;
    }
    const [application] = await this.hydrate([row]);
    return application;
  }

  public async findByCode(code: string): Promise<Application | undefined> {
    const row = (await this.baseQuery().where({ code }).first()) as ApplicationRow | undefined;
    if (!row) {
      return undefined;
    }
    const [application] = await this.hydrate([row]);
    return application;
  }

  private async replaceDeployments(applicationId: string, deployments: DeploymentInput[]): Promise<void> {
    await this.db(DEPLOYMENTS_TABLE_NAME).where({ application_id: applicationId }).del();
    if (deployments.length > 0) {
      await this.db(DEPLOYMENTS_TABLE_NAME).insert(
        deployments.map((deployment) => ({
          application_id: applicationId,
          server_id: deployment.serverId,
          environment: deployment.environment,
          deploy_method: deployment.deployMethod ?? null,
          access_url: deployment.accessUrl ?? null,
          ports: deployment.ports ?? [],
          deployed_version: deployment.deployedVersion ?? null,
          last_deployed_at: this.db.fn.now(),
        })),
      );
    }
  }

  private async replaceDependencies(applicationId: string, dependsOnIds: string[]): Promise<void> {
    await this.db(DEPENDENCIES_TABLE_NAME).where({ application_id: applicationId }).del();
    const uniqueIds = [...new Set(dependsOnIds)].filter((id) => id !== applicationId);
    if (uniqueIds.length > 0) {
      await this.db(DEPENDENCIES_TABLE_NAME).insert(
        uniqueIds.map((dependsOnId) => ({
          application_id: applicationId,
          depends_on_application_id: dependsOnId,
        })),
      );
    }
  }

  public async create(input: CreateApplicationInput): Promise<Application> {
    const rows = (await this.db(TABLE_NAME)
      .insert({
        code: input.code,
        display_name: input.displayName,
        description: input.description ?? null,
        app_type: input.appType,
        business_category: input.businessCategory ?? null,
        criticality: input.criticality ?? 'medium',
        status: input.status ?? 'active',
        language: input.language ?? null,
        framework: input.framework ?? null,
        current_version: input.currentVersion ?? null,
        repository_url: input.repositoryUrl ?? null,
        cicd_url: input.cicdUrl ?? null,
        container_image: input.containerImage ?? null,
        data_classification: input.dataClassification ?? null,
        auth_method: input.authMethod ?? null,
        owner_team: input.ownerTeam ?? null,
        owner_user_id: input.ownerUserId ?? null,
        cost_center: input.costCenter ?? null,
        monthly_cost_estimate: input.monthlyCostEstimate ?? null,
        docs_url: input.docsUrl ?? null,
        api_spec_url: input.apiSpecUrl ?? null,
        runbook_url: input.runbookUrl ?? null,
        monitoring_url: input.monitoringUrl ?? null,
        sla: input.sla ?? null,
        health_check_url: input.healthCheckUrl ?? null,
        metadata: JSON.stringify(input.metadata ?? {}),
      })
      .returning('*')) as ApplicationRow[];

    const application = rows[0];
    if (input.deployments && input.deployments.length > 0) {
      await this.replaceDeployments(application.id, input.deployments);
    }
    if (input.dependsOnIds && input.dependsOnIds.length > 0) {
      await this.replaceDependencies(application.id, input.dependsOnIds);
    }

    return (await this.findById(application.id)) as Application;
  }

  public async update(id: string, input: UpdateApplicationInput): Promise<Application | undefined> {
    const patch: Record<string, unknown> = {};

    if (input.code !== undefined) patch.code = input.code;
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.description !== undefined) patch.description = input.description;
    if (input.appType !== undefined) patch.app_type = input.appType;
    if (input.businessCategory !== undefined) patch.business_category = input.businessCategory;
    if (input.criticality !== undefined) patch.criticality = input.criticality;
    if (input.status !== undefined) patch.status = input.status;
    if (input.language !== undefined) patch.language = input.language;
    if (input.framework !== undefined) patch.framework = input.framework;
    if (input.currentVersion !== undefined) patch.current_version = input.currentVersion;
    if (input.repositoryUrl !== undefined) patch.repository_url = input.repositoryUrl;
    if (input.cicdUrl !== undefined) patch.cicd_url = input.cicdUrl;
    if (input.containerImage !== undefined) patch.container_image = input.containerImage;
    if (input.dataClassification !== undefined) patch.data_classification = input.dataClassification;
    if (input.authMethod !== undefined) patch.auth_method = input.authMethod;
    if (input.ownerTeam !== undefined) patch.owner_team = input.ownerTeam;
    if (input.ownerUserId !== undefined) patch.owner_user_id = input.ownerUserId;
    if (input.costCenter !== undefined) patch.cost_center = input.costCenter;
    if (input.monthlyCostEstimate !== undefined) patch.monthly_cost_estimate = input.monthlyCostEstimate;
    if (input.docsUrl !== undefined) patch.docs_url = input.docsUrl;
    if (input.apiSpecUrl !== undefined) patch.api_spec_url = input.apiSpecUrl;
    if (input.runbookUrl !== undefined) patch.runbook_url = input.runbookUrl;
    if (input.monitoringUrl !== undefined) patch.monitoring_url = input.monitoringUrl;
    if (input.sla !== undefined) patch.sla = input.sla;
    if (input.healthCheckUrl !== undefined) patch.health_check_url = input.healthCheckUrl;
    if (input.metadata !== undefined) patch.metadata = JSON.stringify(input.metadata);

    if (Object.keys(patch).length > 0) {
      await this.baseQuery().where('id', id).update(patch);
    }

    if (input.deployments !== undefined) {
      await this.replaceDeployments(id, input.deployments);
    }
    if (input.dependsOnIds !== undefined) {
      await this.replaceDependencies(id, input.dependsOnIds);
    }

    return this.findById(id);
  }

  public async setStatus(id: string, status: string): Promise<Application | undefined> {
    await this.baseQuery().where('id', id).update({ status });
    return this.findById(id);
  }

  public async softDelete(id: string): Promise<boolean> {
    const affected = (await this.db(TABLE_NAME)
      .whereNull('deleted_at')
      .where('id', id)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected > 0;
  }
}
