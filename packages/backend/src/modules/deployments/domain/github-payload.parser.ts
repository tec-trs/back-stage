import type { NormalizedDeploymentEvent } from './deployment-event.js';

interface GitHubDeploymentStatusPayload {
  deployment_status?: {
    id: number;
    state: string;
    environment: string;
  };
  deployment?: {
    id: number;
    sha: string;
  };
  repository?: {
    html_url: string;
  };
}

function mapStateToEventType(state: string): NormalizedDeploymentEvent['eventType'] {
  if (state === 'success') {
    return 'deployment.completed';
  }
  if (state === 'failure' || state === 'error') {
    return 'deployment.failed';
  }
  return 'deployment.started';
}

export function parseGitHubPayload(payload: unknown): NormalizedDeploymentEvent | null {
  const body = payload as GitHubDeploymentStatusPayload;
  const status = body.deployment_status;
  const deployment = body.deployment;
  const repository = body.repository;

  if (!status || !deployment || !repository) {
    return null;
  }

  return {
    externalId: `github-deployment-${deployment.id}`,
    repositoryUrl: repository.html_url,
    environment: status.environment,
    version: deployment.sha.slice(0, 7),
    eventType: mapStateToEventType(status.state),
    provider: 'github',
  };
}
