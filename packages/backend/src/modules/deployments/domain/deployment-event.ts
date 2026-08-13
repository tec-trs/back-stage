export type DeploymentEventType =
  'deployment.started' | 'deployment.completed' | 'deployment.failed';

export type DeploymentProvider = 'github' | 'gitlab';

export interface NormalizedDeploymentEvent {
  externalId: string;
  repositoryUrl: string;
  environment: string;
  version: string;
  eventType: DeploymentEventType;
  provider: DeploymentProvider;
}
