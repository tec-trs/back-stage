import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';

export interface EcosystemNode {
  id: string;
  kind: 'server' | 'application';
  type: string;
  name: string;
  title: string | null;
  lifecycle: string;
}

export interface EcosystemEdge {
  id: string;
  source: string;
  target: string;
  relationType: 'hosts' | 'dependsOn';
}

export interface EcosystemGraph {
  nodes: EcosystemNode[];
  edges: EcosystemEdge[];
}

interface ServerNodeRow {
  id: string;
  server_type: string;
  hostname: string;
  display_name: string | null;
  status: string;
}

interface ApplicationNodeRow {
  id: string;
  app_type: string;
  code: string;
  display_name: string | null;
  status: string;
}

interface DeploymentEdgeRow {
  id: string;
  server_id: string;
  application_id: string;
}

interface DependencyEdgeRow {
  id: string;
  application_id: string;
  depends_on_application_id: string;
}

export interface IEcosystemGraphRepository {
  getGraph(): Promise<EcosystemGraph>;
}

export class EcosystemGraphRepository implements IEcosystemGraphRepository {
  public constructor(private readonly db: Knex) {}

  public async getGraph(): Promise<EcosystemGraph> {
    const orgId = orgContext.getOrThrow();
    const [serverRows, applicationRows, deploymentRows, dependencyRows] = await Promise.all([
      this.db('servers')
        .where('organization_id', orgId)
        .whereNull('deleted_at')
        .select('id', 'server_type', 'hostname', 'display_name', 'status') as Promise<ServerNodeRow[]>,
      this.db('applications')
        .where('organization_id', orgId)
        .whereNull('deleted_at')
        .select('id', 'app_type', 'code', 'display_name', 'status') as Promise<ApplicationNodeRow[]>,
      this.db('application_deployments')
        .where('organization_id', orgId)
        .whereNull('deleted_at')
        .select('id', 'server_id', 'application_id') as Promise<DeploymentEdgeRow[]>,
      this.db('application_dependencies')
        .where('organization_id', orgId)
        .whereNull('deleted_at')
        .select('id', 'application_id', 'depends_on_application_id') as Promise<DependencyEdgeRow[]>,
    ]);

    const serverNodes: EcosystemNode[] = serverRows.map((row) => ({
      id: row.id,
      kind: 'server',
      type: row.server_type,
      name: row.hostname,
      title: row.display_name,
      lifecycle: row.status,
    }));

    const applicationNodes: EcosystemNode[] = applicationRows.map((row) => ({
      id: row.id,
      kind: 'application',
      type: row.app_type,
      name: row.code,
      title: row.display_name,
      lifecycle: row.status,
    }));

    const nodeIds = new Set([...serverNodes, ...applicationNodes].map((node) => node.id));

    const hostingEdges: EcosystemEdge[] = deploymentRows
      .filter((row) => nodeIds.has(row.server_id) && nodeIds.has(row.application_id))
      .map((row) => ({
        id: row.id,
        source: row.server_id,
        target: row.application_id,
        relationType: 'hosts',
      }));

    const dependencyEdges: EcosystemEdge[] = dependencyRows
      .filter((row) => nodeIds.has(row.application_id) && nodeIds.has(row.depends_on_application_id))
      .map((row) => ({
        id: row.id,
        source: row.application_id,
        target: row.depends_on_application_id,
        relationType: 'dependsOn',
      }));

    return {
      nodes: [...serverNodes, ...applicationNodes],
      edges: [...hostingEdges, ...dependencyEdges],
    };
  }
}
