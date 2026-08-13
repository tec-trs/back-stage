import { describe, expect, it } from 'vitest';

import { parseGitLabPayload } from './gitlab-payload.parser.js';

function buildPayload(status: string) {
  return {
    object_kind: 'pipeline',
    object_attributes: { id: 99, sha: 'fedcba9876543210', status, environment: 'staging' },
    project: { web_url: 'https://gitlab.com/back-stage/back-stage' },
  };
}

describe('parseGitLabPayload', () => {
  it('mapeia status success para deployment.completed', () => {
    const event = parseGitLabPayload(buildPayload('success'));
    expect(event?.eventType).toBe('deployment.completed');
    expect(event?.externalId).toBe('gitlab-pipeline-99');
    expect(event?.environment).toBe('staging');
  });

  it('mapeia status failed/canceled para deployment.failed', () => {
    expect(parseGitLabPayload(buildPayload('failed'))?.eventType).toBe('deployment.failed');
    expect(parseGitLabPayload(buildPayload('canceled'))?.eventType).toBe('deployment.failed');
  });

  it('mapeia outros status para deployment.started', () => {
    expect(parseGitLabPayload(buildPayload('running'))?.eventType).toBe('deployment.started');
  });

  it('retorna null quando object_kind nao e pipeline ou faltam campos', () => {
    expect(parseGitLabPayload({ object_kind: 'merge_request' })).toBeNull();
    expect(parseGitLabPayload({})).toBeNull();
  });
});
