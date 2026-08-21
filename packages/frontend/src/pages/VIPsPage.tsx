import { useNavigate } from 'react-router-dom';

import { useVIPs } from '../features/vips/use-vips';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Spinner } from '../shared/components/Spinner';
import { Badge } from '../shared/components/Badge';
import { PlusIcon } from '../shared/components/icons';

export function VIPsPage() {
  const { data: vips = [], isLoading, error } = useVIPs();
  const navigate = useNavigate();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={String(error)} />;

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">VIPs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gerenciar Virtual IPs e seus servidores associados
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusIcon />
          Novo VIP
        </Button>
      </div>

      {vips.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-slate-400">Nenhum VIP criado</p>
          <p className="mt-2 text-sm text-slate-500">
            Crie seu primeiro VIP para gerenciar servidores em balanceamento
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {vips.map(vip => (
            <div
              key={vip.id}
              onClick={() => navigate(`/vips/${vip.id}`)}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 transition-all hover:border-slate-700 hover:bg-slate-900/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-mono text-sm text-white">{vip.hostname}</p>
                    {vip.displayName && (
                      <p className="mt-1 text-xs text-slate-400">{vip.displayName}</p>
                    )}
                  </div>
                  <Badge tone={vip.status === 'active' ? 'success' : 'warning'}>
                    {vip.status}
                  </Badge>
                </div>
                {vip.vipAddress && (
                  <p className="mt-2 text-xs text-blue-300">{vip.vipAddress}</p>
                )}
              </div>
              <span className="text-slate-500">→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
