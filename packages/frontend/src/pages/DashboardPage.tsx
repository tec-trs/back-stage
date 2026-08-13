import { useGovernanceDashboard } from '../features/governance/use-governance-dashboard';
import { useHealthStatus } from '../features/health/use-health-status';
import { useServices } from '../features/services/use-services';
import { Badge } from '../shared/components/Badge';
import { PageHeader } from '../shared/components/PageHeader';

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: 'danger' | 'warning' | 'success';
}

function StatCard({ label, value, tone }: StatCardProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-red-400'
      : tone === 'warning'
        ? 'text-amber-400'
        : tone === 'success'
          ? 'text-emerald-400'
          : 'text-slate-100';

  return (
    <div className="rounded-lg border border-slate-800 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const health = useHealthStatus();
  const governance = useGovernanceDashboard();
  const services = useServices();

  return (
    <div>
      <PageHeader
        title="Painel"
        description="Visao geral da plataforma"
        actions={
          health.data && (
            <Badge tone={health.data.status === 'ok' ? 'success' : 'warning'}>
              backend {health.data.status === 'ok' ? 'operacional' : health.data.status}
            </Badge>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Servicos" value={services.data?.pagination.total ?? '-'} />
        <StatCard label="Politicas ativas" value={governance.data?.activePolicies ?? '-'} />
        <StatCard
          label="Violacoes"
          value={governance.data?.failCount ?? '-'}
          tone={governance.data && governance.data.failCount > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Exemptions pendentes"
          value={governance.data?.openExemptions ?? '-'}
          tone="warning"
        />
      </div>

      {health.data && (
        <div className="mt-6 rounded-lg border border-slate-800 p-4 text-sm text-slate-400">
          <p>Uptime do backend: {health.data.uptimeSeconds.toFixed(0)}s</p>
          <p>Versao: {health.data.version}</p>
        </div>
      )}
    </div>
  );
}
