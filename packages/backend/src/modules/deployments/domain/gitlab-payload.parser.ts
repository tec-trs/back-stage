import type { NormalizedDeploymentEvent } from './deployment-event.js';

interface GitLabPipelinePayload {
  object_kind?: string;
  object_attributes?: {
    id: number;
    sha: string;
    status: string;
    environment?: string;
  };
  project?: {
    web_url: string;
  };
}

function mapStatusToEventType(status: string): NormalizedDeploymentEvent['eventType'] {
  if (status === 'success') {
    return 'deployment.completed';
  }
  if (status === 'failed' || status === 'canceled') {
    return 'deployment.failed';
  }
  return 'deployment.started';
}

export function parseGitLabPayload(payload: unknown): NormalizedDeploymentEvent | null {
  const body = payload as GitLabPipelinePayload;
  const attributes = body.object_attributes;
  const project = body.project;

  if (body.object_kind !== 'pipeline' || !attributes || !project) {
    return null;
  }

  return {
    externalId: `gitlab-pipeline-${attributes.id}`,
    repositoryUrl: project.web_url,
    environment: attributes.environment ?? 'production',
    version: attributes.sha.slice(0, 7),
    eventType: mapStatusToEventType(attributes.status),
    provider: 'gitlab',
  };
}
