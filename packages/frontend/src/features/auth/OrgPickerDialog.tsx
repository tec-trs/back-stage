import { type OrgOption } from './auth.store';
import { useSelectOrg } from './use-select-org';
import { useSwitchOrg } from './use-switch-org';
import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';

interface OrgPickerDialogProps {
  /** Present when picking org after initial login (not yet authenticated) */
  pendingToken?: string;
  organizations: OrgOption[];
  currentOrgId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function OrgPickerDialog({
  pendingToken,
  organizations,
  currentOrgId,
  onSuccess,
  onCancel,
}: OrgPickerDialogProps) {
  const selectOrg = useSelectOrg(organizations);
  const switchOrg = useSwitchOrg();

  const isPending = selectOrg.isPending || switchOrg.isPending;
  const error = selectOrg.error ?? switchOrg.error;

  function handleSelect(orgId: string): void {
    if (pendingToken) {
      selectOrg.mutate({ pendingToken, organizationId: orgId }, { onSuccess });
    } else {
      switchOrg.mutate({ organizationId: orgId }, { onSuccess });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950 p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-100">Selecione a organizacao</h2>
        <p className="mb-4 text-sm text-slate-400">
          Sua conta pertence a mais de uma organizacao. Escolha com qual deseja continuar.
        </p>

        <div className="flex flex-col gap-2">
          {organizations.map((org) => {
            const isCurrent = org.id === currentOrgId;
            return (
              <button
                key={org.id}
                type="button"
                disabled={isPending || isCurrent}
                onClick={() => handleSelect(org.id)}
                className={[
                  'flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors',
                  isCurrent
                    ? 'border-slate-600 bg-slate-800 text-slate-300 cursor-default'
                    : 'border-slate-700 text-slate-100 hover:border-slate-500 hover:bg-slate-900',
                  isPending && !isCurrent ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <span>
                  <span className="block font-medium">{org.name}</span>
                  <span className="text-xs text-slate-500">{org.slug}</span>
                </span>
                {isCurrent && (
                  <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                    Atual
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4">
            <ErrorMessage message={error.message} />
          </div>
        )}

        {onCancel && (
          <div className="mt-4">
            <Button variant="secondary" className="w-full" onClick={onCancel} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
