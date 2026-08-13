import { deploymentsTotal } from '../../../observability/metrics.js';
import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { NormalizedDeploymentEvent } from '../domain/deployment-event.js';
import type { ICatalogEntityLookup } from '../infrastructure/catalog-entity-lookup.repository.js';
import type { IDeploymentRepository } from '../infrastructure/deployment.repository.js';

export interface DeploymentEventResult {
  matched: boolean;
  deploymentId?: string;
}

function mapEventToStatus(eventType: NormalizedDeploymentEvent['eventType']): string {
  switch (eventType) {
    case 'deployment.completed':
      return 'succeeded';
    case 'deployment.failed':
      return 'failed';
    default:
      return 'running';
  }
}

export class DeploymentTrackingService {
  public constructor(
    private readonly deploymentRepository: IDeploymentRepository,
    private readonly catalogEntityLookup: ICatalogEntityLookup,
  ) {}

  public async handleEvent(event: NormalizedDeploymentEvent): Promise<DeploymentEventResult> {
    const entity = await this.catalogEntityLookup.findByRepositoryUrl(event.repositoryUrl);

    if (!entity) {
      return { matched: false };
    }

    const existing = await this.deploymentRepository.findByExternalId(event.externalId);
    const status = mapEventToStatus(event.eventType);

    const deployment = existing
      ? await this.deploymentRepository.updateStatus(existing.id, {
          status,
          finishedAt: event.eventType === 'deployment.started' ? null : new Date(),
        })
      : await this.deploymentRepository.create({
          entityId: entity.id,
          environment: event.environment,
          version: event.version,
          status,
          startedAt: new Date(),
          metadata: { externalId: event.externalId, provider: event.provider },
        });

    if (!deployment) {
      return { matched: false };
    }

    deploymentsTotal.inc({ status, environment: event.environment });

    await auditLogger.record({
      action: event.eventType,
      resourceType: 'deployment',
      resourceId: deployment.id,
      metadata: { provider: event.provider, entityId: entity.id, externalId: event.externalId },
    });

    return { matched: true, deploymentId: deployment.id };
  }
}
