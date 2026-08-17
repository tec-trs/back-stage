import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useApplications } from '../features/applications/use-applications';
import { useDatabases } from '../features/databases/use-databases';
import { useServers } from '../features/servers/use-servers';
import { useUrls } from '../features/urls/use-urls';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import { exportToCsv } from '../shared/utils/export-csv';

type ResourceKind = 'all' | 'server' | 'application' | 'database' | 'url';

interface InventoryRow {
  id: string;
  kind: 'server' | 'application' | 'database' | 'url';
  name: string;
  status: string;
  environment: string | null;
  criticality: string | null;
  team: string | null;
  path: string;
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  developing: 'default',
  maintenance: 'warning',
  provisioning: 'default',
  deactivated: 'danger',
  deprecated: 'warning',
  inactive: 'warning',
  error: 'danger',
};

const KIND_LABELS: Record<string, string> = {
  server: 'Servidor',
  application: 'Aplicacao',
  database: 'Banco',
  url: 'URL',
};

const CRITICALITY_LABELS: Record<string, string> = {
  critical: 'Critico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Baixo',
};

const CRITICALITY_TONE: Record<string, 'danger' | 'warning' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'default',
  low: 'default',
};

export function InventoryPage() {
  const [kind, setKind] = useState<ResourceKind>('all');
  const [search, setSearch] = useState('');

  const servers = useServers();
  const applications = useApplications();
  const databases = useDatabases({ pageSize: 200 });
  const urls = useUrls({ pageSize: 200 });

  const isLoading =
    servers.isLoading || applications.isLoading || databases.isLoading || urls.isLoading;
  const isError =
    servers.isError || applications.isError || databases.isError || urls.isError;

  const rows: InventoryRow[] = [
    ...(servers.data?.items ?? []).map((s) => ({
      id: s.id,
      kind: 'server' as const,
      name: s.displayName ?? s.hostname,
      status: s.status,
      environment: s.environment,
      criticality: null,
      team: s.ownerTeam,
      path: `/servers/${s.id}`,
    })),
    ...(applications.data?.items ?? []).map((a) => ({
      id: a.id,
      kind: 'application' as const,
      name: a.displayName,
      status: a.status,
      environment: null,
      criticality: a.criticality,
      team: a.ownerTeam,
      path: `/applications/${a.id}`,
    })),
    ...(databases.data?.items ?? []).map((d) => ({
      id: d.id,
      kind: 'database' as const,
      name: d.displayName ?? d.name,
      status: d.status,
      environment: d.environment,
      criticality: d.criticality,
      team: d.ownerTeam,
      path: `/databases/${d.id}`,
    })),
    ...(urls.data?.items ?? []).map((u) => ({
      id: u.id,
      kind: 'url' as const,
      name: u.label,
      status: u.status,
      environment: null,
      criticality: null,
      team: null,
      path: `/urls/${u.id}`,
    })),
  ];

  const filtered = rows.filter((r) => {
    if (kind !== 'all' && r.kind !== kind) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts: Record<ResourceKind, number> = {
    all: rows.length,
    server: rows.filter((r) => r.kind === 'server').length,
    application: rows.filter((r) => r.kind === 'application').length,
    database: rows.filter((r) => r.kind === 'database').length,
    url: rows.filter((r) => r.kind === 'url').length,
  };

  const TABS: Array<{ key: ResourceKind; label: string }> = [
    { key: 'all', label: 'Todos' },
    { key: 'server', label: 'Servidores' },
    { key: 'application', label: 'Aplicacoes' },
    { key: 'database', label: 'Bancos' },
    { key: 'url', label: 'URLs' },
  ];

  return (
    <div>
      <PageHeader
        title="Inventario CMDB"
        description="Visao consolidada de todos os recursos da infraestrutura"
      />

      {/* Export */}
      <div className="mb-4 flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          disabled={filtered.length === 0}
          onClick={() =>
            exportToCsv(
              'inventario-cmdb.csv',
              filtered.map((r) => ({
                Tipo: KIND_LABELS[r.kind],
                Nome: r.name,
                Ambiente: r.environment ?? '',
                Criticidade: r.criticality ? (CRITICALITY_LABELS[r.criticality] ?? r.criticality) : '',
                Time: r.team ?? '',
                Status: r.status,
              })),
            )
          }
        >
          Exportar CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setKind(tab.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
              kind === tab.key
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
            <span className="rounded-full bg-slate-600/60 px-1.5 py-0.5 font-mono text-xs text-slate-300">
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por nome..."
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-slate-500"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message="Erro ao carregar inventario" />}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          {search ? 'Nenhum recurso encontrado para o filtro aplicado.' : 'Nenhum recurso cadastrado.'}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Ambiente</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Criticidade</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Time</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={`${row.kind}:${row.id}`}
                  className="border-b border-slate-800/50 transition-colors last:border-0 hover:bg-slate-900/60"
                >
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-400">
                      {KIND_LABELS[row.kind]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-100">
                    <Link to={row.path} className="hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {row.environment ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {row.criticality ? (
                      <Badge tone={CRITICALITY_TONE[row.criticality] ?? 'default'}>
                        {CRITICALITY_LABELS[row.criticality] ?? row.criticality}
                      </Badge>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {row.team ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[row.status] ?? 'default'}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
