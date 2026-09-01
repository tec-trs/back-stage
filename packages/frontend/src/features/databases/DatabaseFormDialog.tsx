import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { type TabItem, Tabs } from '../../shared/components/Tabs';
import { TagInput } from '../../shared/components/TagInput';
import { CRITICALITY_LABELS } from '../../shared/constants/labels';
import { useEnvironments } from '../environments/use-environments';
import { useServers } from '../servers/use-servers';
import { useTeams } from '../teams/use-teams';
import { useActiveDatabaseEngines } from './use-database-engines';

import type { CreateDatabaseInput } from './use-create-database';
import { useCreateDatabase } from './use-create-database';
import type { Database } from './use-databases';
import { useUpdateDatabase } from './use-update-database';
import { apiRequest } from '../../shared/api/http-client';

const inputClass =
  'rounded-md border border-slate-700 bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500';
const CRITICALITIES = Object.keys(CRITICALITY_LABELS) as Array<keyof typeof CRITICALITY_LABELS>;
const DB_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'active',        label: 'Ativo' },
  { value: 'provisioning',  label: 'Provisionando' },
  { value: 'maintenance',   label: 'Manutencao' },
  { value: 'deprecated',    label: 'Descontinuado' },
  { value: 'deactivated',   label: 'Desativado' },
];

type TabKey = 'identification' | 'parameters' | 'technology' | 'backup' | 'responsible';

const TABS: TabItem[] = [
  { key: 'identification', label: 'Identificacao' },
  { key: 'parameters',     label: 'Parametros' },
  { key: 'technology',     label: 'Tecnologia' },
  { key: 'backup',         label: 'Backup' },
  { key: 'responsible',    label: 'Responsaveis' },
];

interface FormState {
  name: string;
  displayName: string;
  description: string;
  physicalName: string;
  logicalName: string;
  path: string;
  engine: string;
  version: string;
  port: string;
  hostedOnServerId: string;
  connectionHost: string;
  isManagedService: boolean;
  criticality: string;
  ownerTeamSlugs: string[];
  hasBackup: boolean;
  backupPolicy: string;
  status: string;
  environment: string;
}

interface PortItem {
  id?: string;
  port: number;
  parameters: string;
  isNew?: boolean;
  isEditing?: boolean;
}

function emptyForm(): FormState {
  return {
    name: '',
    displayName: '',
    description: '',
    physicalName: '',
    logicalName: '',
    path: '',
    engine: 'postgresql',
    version: '',
    port: '',
    hostedOnServerId: '',
    connectionHost: '',
    isManagedService: false,
    criticality: 'medium',
    ownerTeamSlugs: [],
    hasBackup: false,
    backupPolicy: '',
    status: 'active',
    environment: 'production',
  };
}

function formFromDatabase(db: Database): FormState {
  const existing = db.ownerTeam
    ? db.ownerTeam.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    name: db.name,
    displayName: db.displayName ?? '',
    description: db.description ?? '',
    physicalName: (db as any).physicalName ?? '',
    logicalName: (db as any).logicalName ?? '',
    path: (db as any).path ?? '',
    engine: db.engine,
    version: db.version ?? '',
    port: db.port?.toString() ?? '',
    hostedOnServerId: db.hostedOnServerId ?? '',
    connectionHost: db.connectionHost ?? '',
    isManagedService: db.isManagedService,
    criticality: db.criticality,
    ownerTeamSlugs: existing,
    hasBackup: db.hasBackup,
    backupPolicy: db.backupPolicy ?? '',
    status: db.status,
    environment: db.environment,
  };
}

function toggleSlug(slugs: string[], slug: string): string[] {
  return slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug];
}

export function DatabaseFormDialog({
  isOpen,
  onClose,
  database,
  prefill,
}: {
  isOpen: boolean;
  onClose: () => void;
  database?: Database | null;
  prefill?: Database | null;
}) {
  const isEditMode = Boolean(database);
  const createDatabase = useCreateDatabase();
  const updateDatabase = useUpdateDatabase();
  const mutation = isEditMode ? updateDatabase : createDatabase;

  const { data: environments }  = useEnvironments();
  const { data: serversData }   = useServers();
  const { data: teams = [] }    = useTeams();
  const { data: engines = [] }  = useActiveDatabaseEngines();
  const servers = serversData?.items ?? [];

  const [activeTab, setActiveTab] = useState<TabKey>('identification');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [tags, setTags] = useState<string[]>([]);
  const [ports, setPorts] = useState<PortItem[]>([]);
  const [newPort, setNewPort] = useState<PortItem>({ port: 5432, parameters: '', isNew: true });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    if (database) {
      setForm(formFromDatabase(database));
      // Buscar portas existentes
      (async () => {
        try {
          const response = await apiRequest<PortItem[]>(`/api/databases/${database.id}/ports`);
          setPorts(response.map((p) => ({ ...p, isNew: false })));
        } catch {
          console.error('Erro ao buscar portas');
        }
      })();
    } else if (prefill) {
      const filledForm = formFromDatabase(prefill);
      filledForm.name = '';
      setForm(filledForm);
      setPorts([]);
    } else {
      setForm(emptyForm());
      setPorts([]);
    }
    
    setActiveTab('identification');
    setError('');
  }, [isOpen, database, prefill]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPort() {
    if (newPort.port < 1 || newPort.port > 65535) {
      alert('Porta deve estar entre 1 e 65535');
      return;
    }

    if (ports.some((p) => p.port === newPort.port)) {
      alert('Porta ja existe');
      return;
    }

    setPorts([...ports, { ...newPort, id: `new-${Date.now()}`, isNew: true }]);
    setNewPort({ port: 5432, parameters: '', isNew: true });
  }

  function removePort(id?: string) {
    setPorts(ports.filter((p) => p.id !== id));
  }

  async function savePorts(databaseId: string): Promise<void> {
    for (const port of ports) {
      if (port.isNew || !port.id) {
        console.log('Salvando porta:', port);
        try {
          const response = await apiRequest(`/api/databases/${databaseId}/ports`, {
            method: 'POST',
            body: {
              port: port.port,
              parameters: port.parameters || null,
            },
          });
          console.log('Porta salva com sucesso:', response);
        } catch (err) {
          console.error('Erro ao salvar porta:', err);
          throw new Error(`Erro ao salvar porta ${port.port}: ${err instanceof Error ? err.message : 'Desconhecido'}`);
        }
      }
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const input: CreateDatabaseInput = {
        name: form.name,
        displayName: form.displayName || undefined,
        description: form.description || undefined,
        engine: form.engine,
        version: form.version || undefined,
        environment: form.environment,
        criticality: form.criticality,
        hostedOnServerId: form.hostedOnServerId || undefined,
        connectionHost: form.connectionHost || undefined,
        isManagedService: form.isManagedService,
        hasBackup: form.hasBackup,
        backupPolicy: form.backupPolicy || undefined,
        status: form.status,
        ownerTeam: form.ownerTeamSlugs.length > 0 ? form.ownerTeamSlugs.join(',') : undefined,
        tags: tags.length > 0 ? tags : undefined,
        physicalName: form.physicalName || undefined,
        logicalName: form.logicalName || undefined,
        path: form.path || undefined,
      };

      let result: any;
      if (isEditMode && database) {
        result = await updateDatabase.mutateAsync({ id: database.id, ...input });
      } else {
        result = await createDatabase.mutateAsync(input);
      }
      
      if (ports.length > 0) {
        await savePorts(result.id);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar banco de dados');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={isEditMode ? 'Editar Banco de Dados' : prefill ? 'Duplicar Banco de Dados' : 'Incluir Banco de Dados'}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Tabs 
          tabs={TABS} 
          activeTab={activeTab} 
          onChange={(k) => {
            console.log('Mudando para aba:', k);
            setActiveTab(k as TabKey);
          }} 
        />

        <div className="min-h-[280px] flex flex-col gap-4">

          {activeTab === 'identification' && (
            <fieldset className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Nome (identificador) *</span>
                <input
                  required
                  disabled={isEditMode}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="meu-banco-prod"
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
                />
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Engine *</span>
                  <select
                    value={form.engine}
                    onChange={(e) => setField('engine', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— Selecione —</option>
                    {engines.map((eng) => (
                      <option key={eng.id} value={eng.slug}>{eng.name}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Versao</span>
                  <input
                    value={form.version}
                    onChange={(e) => setField('version', e.target.value)}
                    placeholder="15.4"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Nome Fisico</span>
                  <input
                    value={form.physicalName}
                    onChange={(e) => setField('physicalName', e.target.value)}
                    placeholder="db-server-01"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Nome Logico</span>
                  <input
                    value={form.logicalName}
                    onChange={(e) => setField('logicalName', e.target.value)}
                    placeholder="Banco de Producao"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Caminho</span>
                <input
                  value={form.path}
                  onChange={(e) => setField('path', e.target.value)}
                  placeholder="/var/lib/postgresql/data"
                  className={inputClass}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Ambiente *</span>
                  <select
                    value={form.environment}
                    onChange={(e) => setField('environment', e.target.value)}
                    className={inputClass}
                  >
                    {(environments ?? []).map((env) => (
                      <option key={env.slug} value={env.slug}>{env.name}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Status *</span>
                  <select
                    value={form.status}
                    onChange={(e) => setField('status', e.target.value)}
                    className={inputClass}
                  >
                    {DB_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Descricao</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </label>
            </fieldset>
          )}

          {activeTab === 'parameters' && (
            <fieldset className="flex flex-col gap-4">
              <div className="text-sm text-slate-400">Configurar portas e parametros</div>
              
              {ports.length > 0 && (
                <div className="rounded-md border border-slate-700 overflow-hidden">
                  <div className="bg-slate-800/50 px-4 py-2 grid grid-cols-3 gap-4 text-sm font-medium text-slate-400">
                    <div>Porta</div>
                    <div>Parametros</div>
                    <div className="text-right">Acao</div>
                  </div>
                  {ports.map((p) => (
                    <div key={p.id} className="px-4 py-2 border-t border-slate-700 grid grid-cols-3 gap-4 items-center">
                      <div className="text-slate-200 font-mono">{p.port}</div>
                      <div className="text-slate-300 text-sm truncate">{p.parameters || '—'}</div>
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => removePort(p.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-md border border-slate-700 bg-slate-900/30 p-4 flex flex-col gap-3">
                <div className="text-sm font-medium text-slate-300">Adicionar Nova Porta</div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-400">Porta *</span>
                    <input
                      type="number"
                      min={1}
                      max={65535}
                      value={newPort.port}
                      onChange={(e) => setNewPort({ ...newPort, port: Number(e.target.value) })}
                      placeholder="5432"
                      className={inputClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm col-span-2">
                    <span className="text-slate-400">Parametros</span>
                    <input
                      value={newPort.parameters}
                      onChange={(e) => setNewPort({ ...newPort, parameters: e.target.value })}
                      placeholder="ssl=require, timeout=30"
                      className={inputClass}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={addPort}
                  className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
                >
                  + Adicionar Porta
                </button>
              </div>
            </fieldset>
          )}

          {activeTab === 'technology' && (
            <fieldset className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Servidor hospedeiro</span>
                  <select
                    value={form.hostedOnServerId}
                    onChange={(e) => setField('hostedOnServerId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— Sem servidor vinculado —</option>
                    {servers.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.displayName ?? srv.hostname}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Host de conexao</span>
                  <input
                    value={form.connectionHost}
                    onChange={(e) => setField('connectionHost', e.target.value)}
                    placeholder="db.internal.example.com"
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isManagedService"
                  checked={form.isManagedService}
                  onChange={(e) => setField('isManagedService', e.target.checked)}
                  className="h-4 w-4 accent-sky-500"
                />
                <label htmlFor="isManagedService" className="text-sm text-slate-400 cursor-pointer">
                  Servico gerenciado (RDS, Cloud SQL, etc.)
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Criticidade *</span>
                <select
                  value={form.criticality}
                  onChange={(e) => setField('criticality', e.target.value)}
                  className={inputClass}
                >
                  {CRITICALITIES.map((c) => (
                    <option key={c} value={c}>{CRITICALITY_LABELS[c]}</option>
                  ))}
                </select>
              </label>
            </fieldset>
          )}

          {activeTab === 'backup' && (
            <fieldset className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasBackup"
                  checked={form.hasBackup}
                  onChange={(e) => setField('hasBackup', e.target.checked)}
                  className="h-4 w-4 accent-sky-500"
                />
                <label htmlFor="hasBackup" className="text-sm text-slate-400 cursor-pointer">
                  Possui backup configurado
                </label>
              </div>
              {form.hasBackup && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Politica de backup</span>
                  <input
                    value={form.backupPolicy}
                    onChange={(e) => setField('backupPolicy', e.target.value)}
                    placeholder="Diario as 02h, retencao 30 dias"
                    className={inputClass}
                  />
                </label>
              )}
              {!form.hasBackup && (
                <p className="text-sm text-slate-500 rounded-md border border-amber-900/40 bg-amber-950/20 px-4 py-3">
                  Este banco nao possui backup configurado. Considere habilitar para ambientes de producao.
                </p>
              )}
            </fieldset>
          )}

          {activeTab === 'responsible' && (
            <fieldset className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Equipes responsaveis</span>
                {teams.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum time cadastrado.</p>
                ) : (
                  <div className="flex flex-col gap-1 rounded-md border border-slate-700 bg-canvas p-3 max-h-48 overflow-y-auto">
                    {teams.map((team) => (
                      <label key={team.slug} className="flex items-center gap-2 cursor-pointer py-1 hover:text-slate-100">
                        <input
                          type="checkbox"
                          checked={form.ownerTeamSlugs.includes(team.slug)}
                          onChange={() => setField('ownerTeamSlugs', toggleSlug(form.ownerTeamSlugs, team.slug))}
                          className="h-4 w-4 accent-sky-500"
                        />
                        <span className="text-sm text-slate-300">{team.name}</span>
                        {team.description && (
                          <span className="text-xs text-slate-500">— {team.description}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {form.ownerTeamSlugs.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {form.ownerTeamSlugs.length} time{form.ownerTeamSlugs.length > 1 ? 's' : ''} selecionado{form.ownerTeamSlugs.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Tags</span>
                <TagInput tags={tags} onChange={setTags} placeholder="producao, legado..." />
              </div>
            </fieldset>
          )}
        </div>

        {(error || mutation.isError) && (
          <ErrorMessage
            message={
              error ||
              (mutation.error instanceof Error
                ? mutation.error.message
                : 'Erro ao salvar banco de dados')
            }
          />
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving || mutation.isPending}>
            {isSaving || mutation.isPending
              ? 'Salvando...'
              : isEditMode
                ? 'Salvar alteracoes'
                : prefill
                  ? 'Criar copia'
                  : 'Criar banco de dados'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
