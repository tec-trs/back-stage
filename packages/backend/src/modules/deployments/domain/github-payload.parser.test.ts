import { describe, expect, it } from 'vitest';

import { parseGitHubPayload } from './github-payload.parser.js';

function buildPayload(state: string) {
  return {
    deployment_status: { id: 42, state, environment: 'production' },
    deployment: { id: 7, sha: 'abcdef1234567890' },
    repository: { html_url: 'https://github.com/back-stage/back-stage' },
  };
}

describe('parseGitHubPayload', () => {
  it('mapeia state success para deployment.completed', () => {
    const event = parseGitHubPayload(buildPayload('success'));
    expect(event?.eventType).toBe('deployment.completed');
    expect(event?.externalId).toBe('github-deployment-7');
    expect(event?.version).toBe('abcdef1');
  });

  it('mapeia state failure/error para deployment.failed', () => {
    expect(parseGitHubPayload(buildPayload('failure'))?.eventType).toBe('deployment.failed');
    expect(parseGitHubPayload(buildPayload('error'))?.eventType).toBe('deployment.failed');
  });

  it('mapeia outros states para deployment.started', () => {
    expect(parseGitHubPayload(buildPayload('in_progress'))?.eventType).toBe('deployment.started');
    expect(parseGitHubPayload(buildPayload('queued'))?.eventType).toBe('deployment.started');
  });

  it('retorna null para payload sem os campos esperados', () => {
    expect(parseGitHubPayload({})).toBeNull();
    expect(
      parseGitHubPayload({ deployment_status: { id: 1, state: 'success', environment: 'x' } }),
    ).toBeNull();
  });
});
