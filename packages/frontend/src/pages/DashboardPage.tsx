import { Link } from 'react-router-dom';

import { useApplications } from '../features/applications/use-applications';
import { useDatabases } from '../features/databases/use-databases';
import { useGovernanceDashboard } from '../features/governance/use-governance-dashboard';
import { useHealthStatus } from '../features/health/use-health-status';
import { useServers } from '../features/servers/use-servers';
import { useUrls } from '../features/urls/use-urls';
import { Badge } from '../shared/components/Badge';
import { PageHeader } from '../shared/components/PageHeader';

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: 'danger' | 'warning' | 'success';
  href?: string;
}

function StatCard({ label, value, tone, href }: StatCardProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-impact-source'
      : tone === 'warning'
        ? 'text-signal'
        : tone === 'success'
          ? 'text-emerald-400'
          : 'text-slate-100';

  const content = (
    <div className="rounded border border-line bg-surface/50 p-4 transition-colors hover:border-slate-600 hover:bg-surface">
      <p className="font-mono text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1.5 font-mono text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
      <span className="text-signal">▸</span>
      {children}
    </h2>
  );
}

export function DashboardPage() {
  const health = useHealthStatus();
  const governance = useGovernanceDashboard();
  const servers = useServers();
  const applications = useApplications();
  const databases = useDatabases({ pageSize: 1 });
  const urls = useUrls({ pageSize: 1 });

  const activeServers =
    servers.data?.items.filter((s) => s.status === 'active').length ?? null;
  const activeApplications =
    applications.data?.items.filter((a) => a.status === 'active').length ?? null;
  const criticalApplications =
    applications.data?.items.filter((a) => a.criticality === 'critical').length ?? null;

  return (
    <div>
      <PageHeader
        title="Painel CMDB"
        description="Visao geral da infraestrutura e governanca"
        actions={
          health.data && (
            <Badge tone={health.data.status === 'ok' ? 'success' : 'warning'}>
              backend {health.data.status === 'ok' ? 'operacional' : health.data.status}
            </Badge>
          )
        }
      />

      {/* CMDB Inventory */}
      <section className="mb-6">
        <SectionLabel>Inventario</SectionLabel>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Servidores"
            value={servers.data?.pagination.total ?? '…'}
            href="/servers"
          />
          <StatCard
            label="Aplicacoes"
            value={applications.data?.pagination.total ?? '…'}
            href="/applications"
          />
          <StatCard
            label="Bancos de dados"
            value={databases.data?.pagination.total ?? '…'}
            href="/databases"
          />
          <StatCard
            label="URLs / Endpoints"
            value={urls.data?.pagination.total ?? '…'}
            href="/urls"
          />
        </div>
      </section>

      {/* Health Highlights */}
      <section className="mb-6">
        <SectionLabel>Saude</SectionLabel>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Servidores ativos"
            value={activeServers ?? '…'}
            tone={activeServers !== null && activeServers > 0 ? 'success' : undefined}
          />
          <StatCard
            label="Aplicacoes ativas"
            value={activeApplications ?? '…'}
            tone={activeApplications !== null && activeApplications > 0 ? 'success' : undefined}
          />
          <StatCard
            label="Apps criticas"
            value={criticalApplications ?? '…'}
            tone={criticalApplications !== null && criticalApplications > 0 ? 'danger' : 'success'}
          />
          <StatCard
            label="Violacoes"
            value={governance.data?.failCount ?? '…'}
            tone={
              governance.data && governance.data.failCount > 0
                ? 'danger'
                : governance.data
                  ? 'success'
                  : undefined
            }
            href="/governance"
          />
        </div>
      </section>

      {/* Quick links */}
      <section className="mb-6">
        <SectionLabel>Acesso rapido</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Inventario CMDB', href: '/inventory', desc: 'Todos os recursos em uma tela' },
            { label: 'Ecossistema', href: '/ecosystem', desc: 'Grafo completo de dependencias' },
            { label: 'Governanca', href: '/governance', desc: 'Politicas e violacoes' },
            { label: 'Auditoria', href: '/audit', desc: 'Historico de mudancas' },
            { label: 'Ambientes', href: '/environments', desc: 'Gerenciar ambientes' },
            { label: 'Times', href: '/teams', desc: 'Times responsaveis' },
          ].map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded border border-line p-4 transition-colors hover:border-slate-600 hover:bg-surface/50"
            >
              <p className="font-medium text-slate-200">{link.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {health.data && (
        <div className="rounded border border-line p-4 font-mono text-xs text-slate-500">
          <p>Uptime do backend: {health.data.uptimeSeconds.toFixed(0)}s</p>
          <p>Versao: {health.data.version}</p>
        </div>
      )}
    </div>
  );
}
