import { useGovernanceDashboard } from '../features/governance/use-governance-dashboard';
import { useViolations } from '../features/governance/use-violations';
import { Badge } from '../shared/components/Badge';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

interface StatCardProps {
  label: string;
  value: number;
  tone?: 'danger' | 'warning';
}

function StatCard({ label, value, tone }: StatCardProps) {
  const toneClass =
    tone === 'danger' ? 'text-red-400' : tone === 'warning' ? 'text-amber-400' : 'text-slate-100';
  return (
    <div className="rounded border border-line p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function GovernancePage() {
  const dashboard = useGovernanceDashboard();
  const violations = useViolations();

  return (
    <div>
      <PageHeader
        title="Governanca"
        description="Painel de conformidade e violacoes de politicas ativas"
      />

      {dashboard.isLoading && <Spinner />}
      {dashboard.isError && (
        <ErrorMessage
          message={
            dashboard.error instanceof Error
              ? dashboard.error.message
              : 'Erro ao carregar painel'
          }
        />
      )}

      {dashboard.data && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Politicas ativas" value={dashboard.data.activePolicies} />
          <StatCard label="Avaliacoes" value={dashboard.data.totalEvaluations} />
          <StatCard label="Falhas" value={dashboard.data.failCount} tone="danger" />
          <StatCard
            label="Exemptions pendentes"
            value={dashboard.data.openExemptions}
            tone="warning"
          />
        </div>
      )}

      <h2 className="mb-3 text-lg font-medium text-slate-200">Violacoes ativas</h2>

      {violations.isLoading && <Spinner />}
      {violations.data && violations.data.items.length === 0 && (
        <EmptyState
          title="Nenhuma violacao ativa"
          description="Todas as entidades estao em conformidade."
        />
      )}

      {violations.data && violations.data.items.length > 0 && (
        <ul className="space-y-2">
          {violations.data.items.map((violation) => (
            <li
              key={violation.id}
              className="flex items-center justify-between rounded border border-line p-3 text-sm"
            >
              <div>
                <p className="text-slate-100">{violation.policyName}</p>
                <p className="text-slate-500">{violation.entityName}</p>
              </div>
              <Badge tone="danger">falha</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
