export type AppType =
  | 'web_app'
  | 'api_backend'
  | 'mobile'
  | 'batch_job'
  | 'microservice'
  | 'monolith'
  | 'internal_library'
  | 'middleware';

export type Criticality = 'critical' | 'high' | 'medium' | 'low';

export type ApplicationStatus = 'developing' | 'active' | 'maintenance' | 'deprecated' | 'deactivated';

export type DeployEnvironment = 'production' | 'staging' | 'development' | 'dr' | 'sandbox';

export interface ApplicationDeploymentRow {
  id: string;
  application_id: string;
  server_id: string;
  server_hostname?: string;
  environment: string;
  deploy_method: string | null;
  access_url: string | null;
  ports: string[];
  deployed_version: string | null;
  last_deployed_at: Date | null;
}

export class ApplicationDeployment {
  public readonly id: string;
  public readonly serverId: string;
  public readonly serverHostname: string | null;
  public readonly environment: DeployEnvironment;
  public readonly deployMethod: string | null;
  public readonly accessUrl: string | null;
  public readonly ports: string[];
  public readonly deployedVersion: string | null;
  public readonly lastDeployedAt: Date | null;

  public constructor(row: ApplicationDeploymentRow) {
    this.id = row.id;
    this.serverId = row.server_id;
    this.serverHostname = row.server_hostname ?? null;
    this.environment = row.environment as DeployEnvironment;
    this.deployMethod = row.deploy_method;
    this.accessUrl = row.access_url;
    this.ports = row.ports;
    this.deployedVersion = row.deployed_version;
    this.lastDeployedAt = row.last_deployed_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      serverId: this.serverId,
      serverHostname: this.serverHostname,
      environment: this.environment,
      deployMethod: this.deployMethod,
      accessUrl: this.accessUrl,
      ports: this.ports,
      deployedVersion: this.deployedVersion,
      lastDeployedAt: this.lastDeployedAt,
    };
  }
}

export interface ApplicationDependencyRef {
  id: string;
  code: string;
  displayName: string;
}

export interface ApplicationRow {
  id: string;
  code: string;
  display_name: string;
  description: string | null;
  app_type: string;
  business_category: string | null;
  criticality: string;
  status: string;
  language: string | null;
  framework: string | null;
  current_version: string | null;
  repository_url: string | null;
  cicd_url: string | null;
  container_image: string | null;
  data_classification: string | null;
  auth_method: string | null;
  owner_team: string | null;
  owner_user_id: string | null;
  cost_center: string | null;
  monthly_cost_estimate: string | null;
  docs_url: string | null;
  api_spec_url: string | null;
  runbook_url: string | null;
  monitoring_url: string | null;
  sla: string | null;
  health_check_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class Application {
  public readonly id: string;
  public readonly code: string;
  public readonly displayName: string;
  public readonly description: string | null;
  public readonly appType: AppType;
  public readonly businessCategory: string | null;
  public readonly criticality: Criticality;
  public readonly status: ApplicationStatus;
  public readonly language: string | null;
  public readonly framework: string | null;
  public readonly currentVersion: string | null;
  public readonly repositoryUrl: string | null;
  public readonly cicdUrl: string | null;
  public readonly containerImage: string | null;
  public readonly dataClassification: string | null;
  public readonly authMethod: string | null;
  public readonly ownerTeam: string | null;
  public readonly ownerUserId: string | null;
  public readonly costCenter: string | null;
  public readonly monthlyCostEstimate: number | null;
  public readonly docsUrl: string | null;
  public readonly apiSpecUrl: string | null;
  public readonly runbookUrl: string | null;
  public readonly monitoringUrl: string | null;
  public readonly sla: string | null;
  public readonly healthCheckUrl: string | null;
  public readonly metadata: Record<string, unknown>;
  public readonly deployments: ApplicationDeployment[];
  public readonly dependsOn: ApplicationDependencyRef[];
  public readonly dependents: ApplicationDependencyRef[];
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(
    row: ApplicationRow,
    deployments: ApplicationDeployment[] = [],
    dependsOn: ApplicationDependencyRef[] = [],
    dependents: ApplicationDependencyRef[] = [],
  ) {
    this.id = row.id;
    this.code = row.code;
    this.displayName = row.display_name;
    this.description = row.description;
    this.appType = row.app_type as AppType;
    this.businessCategory = row.business_category;
    this.criticality = row.criticality as Criticality;
    this.status = row.status as ApplicationStatus;
    this.language = row.language;
    this.framework = row.framework;
    this.currentVersion = row.current_version;
    this.repositoryUrl = row.repository_url;
    this.cicdUrl = row.cicd_url;
    this.containerImage = row.container_image;
    this.dataClassification = row.data_classification;
    this.authMethod = row.auth_method;
    this.ownerTeam = row.owner_team;
    this.ownerUserId = row.owner_user_id;
    this.costCenter = row.cost_center;
    this.monthlyCostEstimate = row.monthly_cost_estimate ? Number(row.monthly_cost_estimate) : null;
    this.docsUrl = row.docs_url;
    this.apiSpecUrl = row.api_spec_url;
    this.runbookUrl = row.runbook_url;
    this.monitoringUrl = row.monitoring_url;
    this.sla = row.sla;
    this.healthCheckUrl = row.health_check_url;
    this.metadata = row.metadata;
    this.deployments = deployments;
    this.dependsOn = dependsOn;
    this.dependents = dependents;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.code,
      displayName: this.displayName,
      description: this.description,
      appType: this.appType,
      businessCategory: this.businessCategory,
      criticality: this.criticality,
      status: this.status,
      language: this.language,
      framework: this.framework,
      currentVersion: this.currentVersion,
      repositoryUrl: this.repositoryUrl,
      cicdUrl: this.cicdUrl,
      containerImage: this.containerImage,
      dataClassification: this.dataClassification,
      authMethod: this.authMethod,
      ownerTeam: this.ownerTeam,
      ownerUserId: this.ownerUserId,
      costCenter: this.costCenter,
      monthlyCostEstimate: this.monthlyCostEstimate,
      docsUrl: this.docsUrl,
      apiSpecUrl: this.apiSpecUrl,
      runbookUrl: this.runbookUrl,
      monitoringUrl: this.monitoringUrl,
      sla: this.sla,
      healthCheckUrl: this.healthCheckUrl,
      metadata: this.metadata,
      deployments: this.deployments.map((deployment) => deployment.toJSON()),
      dependsOn: this.dependsOn,
      dependents: this.dependents,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
