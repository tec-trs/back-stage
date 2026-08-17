import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { TagInput } from '../../shared/components/TagInput';
import { CRITICALITY_LABELS } from '../../shared/constants/labels';
import { useEnvironments } from '../environments/use-environments';
import { useServers } from '../servers/use-servers';

import type { CreateDatabaseInput } from './use-create-database';
import { useCreateDatabase } from './use-create-database';
import type { Database } from './use-databases';
import { useUpdateDatabase } from './use-update-database';

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

const DB_ENGINES = ['postgresql', 'mysql', 'mssql', 'mariadb', 'oracle', 'sqlite', 'mongodb', 'redis', 'elasticsearch', 'cassandra'];
const CRITICALITIES = Object.keys(CRITICALITY_LABELS) as Array<keyof typeof CRITICALITY_LABELS>;
const DB_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'active', label: 'Ativo' },
  { value: 'provisioning', label: 'Provisionando' },
  { value: 'maintenance', label: 'Manutencao' },
  { value: 'deprecated', label: 'Descontinuado' },
  { value: 'deactivated', label: 'Desativado' },
];

interface FormState {
  name: string;
  displayName: string;
  description: string;
  engine: string;
  version: string;
  port: string;
  hostedOnServerId: string;
  connectionHost: string;
  isManagedService: boolean;
  criticality: string;
  ownerTeam: string;
  storageGb: string;
  hasBackup: boolean;
  backupPolicy: string;
  status: string;
  environment: string;
  monitoringUrl: string;
}

function emptyForm(): FormState {
  return {
    name: '',
    displayName: '',
    description: '',
    engine: 'postgresql',
    version: '',
    port: '',
    hostedOnServerId: '',
    connectionHost: '',
    isManagedService: false,
    criticality: 'medium',
    ownerTeam: '',
    storageGb: '',
    hasBackup: false,
    backupPolicy: '',
    status: 'active',
    environment: 'production',
    monitoringUrl: '',
  };
}

function formFromDatabase(db: Database): FormState {
  return {
    name: db.name,
    displayName: db.displayName ?? '',
    description: db.description ?? '',
    engine: db.engine,
    version: db.version ?? '',
    port: db.port?.toString() ?? '',
    hostedOnServerId: db.hostedOnServerId ?? '',
    connectionHost: db.connectionHost ?? '',
    isManagedService: db.isManagedService,
    criticality: db.criticality,
    ownerTeam: db.ownerTeam ?? '',
    storageGb: db.storageGb?.toString() ?? '',
    hasBackup: db.hasBackup,
    backupPolicy: db.backupPolicy ?? '',
    status: db.status,
    environment: db.environment,
    monitoringUrl: db.monitoringUrl ?? '',
  };
}

export function DatabaseFormDialog({
  isOpen,
  onClose,
  database,
}: {
  isOpen: boolean;
  onClose: () => void;
  database?: Database | null;
}) {
  const isEditMode = Boolean(database);
  const createDatabase = useCreateDatabase();
  const updateDatabase = useUpdateDatabase();
  const mutation = isEditMode ? updateDatabase : createDatabase;

  const { data: environments } = useEnvironments();
  const { data: serversData } = useServers();
  const servers = serversData?.items ?? [];

  const [form, setForm] = useState<FormState>(emptyForm());
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setForm(database ? formFromDatabase(database) : emptyForm());
      setTags(database?.tags ?? []);
      createDatabase.reset();
      updateDatabase.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, database]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const payload: CreateDatabaseInput = {
      name: form.name.trim(),
      displayName: form.displayName.trim() || null,
      description: form.description.trim() || null,
      engine: form.engine,
      version: form.version.trim() || null,
      port: form.port ? Number(form.port) : null,
      hostedOnServerId: form.hostedOnServerId || null,
      connectionHost: form.connectionHost.trim() || null,
      isManagedService: form.isManagedService,
      criticality: form.criticality,
      ownerTeam: form.ownerTeam.trim() || null,
      storageGb: form.storageGb ? Number(form.storageGb) : null,
      hasBackup: form.hasBackup,
      backupPolicy: form.backupPolicy.trim() || null,
      status: form.status,
      environment: form.environment,
      monitoringUrl: form.monitoringUrl.trim() || null,
      tags: tags.map((t) => t.trim()).filter(Boolean),
    };

    if (isEditMode && database) {
      updateDatabase.mutate({ id: database.id, ...payload }, { onSuccess: onClose });
      return;
    }

    createDatabase.mutate(payload, { onSuccess: onClose });
  }

  return (
    <Modal
      title={isEditMode ? 'Editar Banco de Dados' : 'Incluir Banco de Dados'}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          {/* Identificacao */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Identificacao
            </legend>
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
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Nome amigavel</span>
              <input
                value={form.displayName}
                onChange={(e) => setField('displayName', e.target.value)}
                placeholder="Banco de Producao"
                className={inputClass}
              />
            </label>
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

          {/* Tecnologia */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tecnologia
            </legend>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Engine *</span>
                <select
                  value={form.engine}
                  onChange={(e) => setField('engine', e.target.value)}
                  className={inputClass}
                >
                  {DB_ENGINES.map((eng) => (
                    <option key={eng} value={eng}>
                      {eng}
                    </option>
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
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Porta</span>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={form.port}
                  onChange={(e) => setField('port', e.target.value)}
                  placeholder="5432"
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
          </fieldset>

          {/* Infraestrutura */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Infraestrutura
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Ambiente *</span>
                <select
                  value={form.environment}
                  onChange={(e) => setField('environment', e.target.value)}
                  className={inputClass}
                >
                  {(environments ?? []).map((env) => (
                    <option key={env.slug} value={env.slug}>
                      {env.name}
                    </option>
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
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Criticidade *</span>
                <select
                  value={form.criticality}
                  onChange={(e) => setField('criticality', e.target.value)}
                  className={inputClass}
                >
                  {CRITICALITIES.map((c) => (
                    <option key={c} value={c}>
                      {CRITICALITY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Armazenamento (GB)</span>
                <input
                  type="number"
                  min={0}
                  value={form.storageGb}
                  onChange={(e) => setField('storageGb', e.target.value)}
                  placeholder="100"
                  className={inputClass}
                />
              </label>
            </div>
          </fieldset>

          {/* Backup & Monitoramento */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Backup & Monitoramento
            </legend>
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
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">URL de monitoramento</span>
              <input
                type="url"
                value={form.monitoringUrl}
                onChange={(e) => setField('monitoringUrl', e.target.value)}
                placeholder="https://grafana.example.com/d/..."
                className={inputClass}
              />
            </label>
          </fieldset>

          {/* Responsavel & Tags */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Responsavel & Tags
            </legend>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Equipe responsavel</span>
              <input
                value={form.ownerTeam}
                onChange={(e) => setField('ownerTeam', e.target.value)}
                placeholder="DBA, Infraestrutura..."
                className={inputClass}
              />
            </label>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Tags</span>
              <TagInput tags={tags} onChange={setTags} placeholder="producao, legado..." />
            </div>
          </fieldset>
        </div>

        {mutation.isError && (
          <ErrorMessage
            message={
              mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar banco de dados'
            }
          />
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Salvando...'
              : isEditMode
                ? 'Salvar alteracoes'
                : 'Criar banco de dados'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
