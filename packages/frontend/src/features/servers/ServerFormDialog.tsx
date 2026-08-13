import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import {
  DISK_PURPOSE_LABELS,
  DISK_TYPE_LABELS,
  ENVIRONMENT_LABELS,
  PROVIDER_LABELS,
  SERVER_STATUS_LABELS,
  SERVER_TYPE_LABELS,
} from '../../shared/constants/labels';

import type { ServerDiskInput } from './use-create-server';
import { useCreateServer } from './use-create-server';
import type {
  DiskPurpose,
  DiskType,
  ServerEnvironment,
  ServerProvider,
  ServerStatus,
  ServerSummary,
  ServerType,
} from './use-servers';
import { useUpdateServer } from './use-update-server';

const HOSTNAME_PATTERN = /^[a-z0-9.-]+$/;
const SERVER_TYPES = Object.keys(SERVER_TYPE_LABELS) as ServerType[];
const PROVIDERS = Object.keys(PROVIDER_LABELS) as ServerProvider[];
const STATUSES = Object.keys(SERVER_STATUS_LABELS) as ServerStatus[];
const ENVIRONMENTS = Object.keys(ENVIRONMENT_LABELS) as ServerEnvironment[];
const DISK_TYPES = Object.keys(DISK_TYPE_LABELS) as DiskType[];
const DISK_PURPOSES = Object.keys(DISK_PURPOSE_LABELS) as DiskPurpose[];

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

function csvToList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

interface FormState {
  hostname: string;
  displayName: string;
  description: string;
  serverType: ServerType;
  provider: ServerProvider;
  cpuCores: string;
  ramGb: string;
  hypervisor: string;
  osName: string;
  osVersion: string;
  osArchitecture: string;
  privateIps: string;
  publicIp: string;
  vlanSubnet: string;
  gateway: string;
  dnsServers: string;
  accessMethod: string;
  securityGroup: string;
  dataClassification: string;
  status: ServerStatus;
  environment: ServerEnvironment;
  ownerTeam: string;
  costCenter: string;
  hasBackup: boolean;
  backupPolicy: string;
  monthlyCostEstimate: string;
  monitoringUrl: string;
}

function emptyForm(): FormState {
  return {
    hostname: '',
    displayName: '',
    description: '',
    serverType: 'vm',
    provider: 'on_premise',
    cpuCores: '',
    ramGb: '',
    hypervisor: '',
    osName: '',
    osVersion: '',
    osArchitecture: '',
    privateIps: '',
    publicIp: '',
    vlanSubnet: '',
    gateway: '',
    dnsServers: '',
    accessMethod: '',
    securityGroup: '',
    dataClassification: '',
    status: 'active',
    environment: 'production',
    ownerTeam: '',
    costCenter: '',
    hasBackup: false,
    backupPolicy: '',
    monthlyCostEstimate: '',
    monitoringUrl: '',
  };
}

function formFromServer(server: ServerSummary): FormState {
  return {
    hostname: server.hostname,
    displayName: server.displayName ?? '',
    description: server.description ?? '',
    serverType: server.serverType,
    provider: server.provider,
    cpuCores: server.cpuCores?.toString() ?? '',
    ramGb: server.ramGb?.toString() ?? '',
    hypervisor: server.hypervisor ?? '',
    osName: server.osName ?? '',
    osVersion: server.osVersion ?? '',
    osArchitecture: server.osArchitecture ?? '',
    privateIps: server.privateIps.join(', '),
    publicIp: server.publicIp ?? '',
    vlanSubnet: server.vlanSubnet ?? '',
    gateway: server.gateway ?? '',
    dnsServers: server.dnsServers.join(', '),
    accessMethod: server.accessMethod ?? '',
    securityGroup: server.securityGroup ?? '',
    dataClassification: server.dataClassification ?? '',
    status: server.status,
    environment: server.environment,
    ownerTeam: server.ownerTeam ?? '',
    costCenter: server.costCenter ?? '',
    hasBackup: server.hasBackup,
    backupPolicy: server.backupPolicy ?? '',
    monthlyCostEstimate: server.monthlyCostEstimate?.toString() ?? '',
    monitoringUrl: server.monitoringUrl ?? '',
  };
}

export function ServerFormDialog({
  isOpen,
  onClose,
  server,
}: {
  isOpen: boolean;
  onClose: () => void;
  server?: ServerSummary | null;
}) {
  const isEditMode = Boolean(server);
  const createServer = useCreateServer();
  const updateServer = useUpdateServer();
  const mutation = isEditMode ? updateServer : createServer;

  const [form, setForm] = useState<FormState>(emptyForm());
  const [disks, setDisks] = useState<ServerDiskInput[]>([]);
  const [hostnameError, setHostnameError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(server ? formFromServer(server) : emptyForm());
      setDisks(
        server?.disks.map((disk) => ({
          mountPoint: disk.mountPoint,
          capacityGb: disk.capacityGb,
          diskType: disk.diskType,
          purpose: disk.purpose,
        })) ?? [],
      );
      setHostnameError(null);
      createServer.reset();
      updateServer.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, server]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addDisk(): void {
    setDisks((current) => [
      ...current,
      { mountPoint: '', capacityGb: 100, diskType: 'ssd', purpose: 'data' },
    ]);
  }

  function updateDisk(index: number, patch: Partial<ServerDiskInput>): void {
    setDisks((current) => current.map((disk, i) => (i === index ? { ...disk, ...patch } : disk)));
  }

  function removeDisk(index: number): void {
    setDisks((current) => current.filter((_, i) => i !== index));
  }

  function handleClose(): void {
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!HOSTNAME_PATTERN.test(form.hostname)) {
      setHostnameError('O hostname deve conter apenas letras minusculas, numeros, ponto e hifen');
      return;
    }
    setHostnameError(null);

    const payload = {
      hostname: form.hostname,
      displayName: form.displayName.trim() || null,
      description: form.description.trim() || null,
      serverType: form.serverType,
      provider: form.provider,
      cpuCores: form.cpuCores ? Number(form.cpuCores) : null,
      ramGb: form.ramGb ? Number(form.ramGb) : null,
      hypervisor: form.hypervisor.trim() || null,
      osName: form.osName.trim() || null,
      osVersion: form.osVersion.trim() || null,
      osArchitecture: form.osArchitecture.trim() || null,
      privateIps: csvToList(form.privateIps),
      publicIp: form.publicIp.trim() || null,
      vlanSubnet: form.vlanSubnet.trim() || null,
      gateway: form.gateway.trim() || null,
      dnsServers: csvToList(form.dnsServers),
      accessMethod: form.accessMethod.trim() || null,
      securityGroup: form.securityGroup.trim() || null,
      dataClassification: form.dataClassification.trim() || null,
      status: form.status,
      environment: form.environment,
      ownerTeam: form.ownerTeam.trim() || null,
      costCenter: form.costCenter.trim() || null,
      hasBackup: form.hasBackup,
      backupPolicy: form.backupPolicy.trim() || null,
      monthlyCostEstimate: form.monthlyCostEstimate ? Number(form.monthlyCostEstimate) : null,
      monitoringUrl: form.monitoringUrl.trim() || null,
      disks,
    };

    if (isEditMode && server) {
      updateServer.mutate({ id: server.id, ...payload }, { onSuccess: handleClose });
      return;
    }

    createServer.mutate(payload, { onSuccess: handleClose });
  }

  return (
    <Modal
      title={isEditMode ? 'Editar Servidor' : 'Incluir Servidor'}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">Identificacao</legend>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Hostname *</span>
            <input
              required
              disabled={isEditMode}
              value={form.hostname}
              onChange={(event) => setField('hostname', event.target.value)}
              placeholder="web-01.prod"
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
            />
            {hostnameError && <span className="text-xs text-red-400">{hostnameError}</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Nome amigavel</span>
            <input
              value={form.displayName}
              onChange={(event) => setField('displayName', event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Descricao</span>
            <textarea
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              rows={2}
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Tipo *</span>
              <select
                value={form.serverType}
                onChange={(event) => setField('serverType', event.target.value as ServerType)}
                className={inputClass}
              >
                {SERVER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SERVER_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Provedor *</span>
              <select
                value={form.provider}
                onChange={(event) => setField('provider', event.target.value as ServerProvider)}
                className={inputClass}
              >
                {PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {PROVIDER_LABELS[provider]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">Hardware / Recursos</legend>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">CPU (nucleos)</span>
              <input
                type="number"
                min={1}
                value={form.cpuCores}
                onChange={(event) => setField('cpuCores', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">RAM (GB)</span>
              <input
                type="number"
                min={1}
                value={form.ramGb}
                onChange={(event) => setField('ramGb', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Hypervisor</span>
              <input
                value={form.hypervisor}
                onChange={(event) => setField('hypervisor', event.target.value)}
                placeholder="VMware, KVM..."
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-slate-800 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Discos</span>
              <Button type="button" variant="secondary" size="sm" onClick={addDisk}>
                + Disco
              </Button>
            </div>
            {disks.length === 0 && (
              <p className="text-xs text-slate-500">Nenhum disco adicionado.</p>
            )}
            {disks.map((disk, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-end gap-2">
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Mount point</span>
                  <input
                    value={disk.mountPoint}
                    onChange={(event) => updateDisk(index, { mountPoint: event.target.value })}
                    placeholder="/data"
                    className={`${inputClass} py-1.5 text-sm`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">GB</span>
                  <input
                    type="number"
                    min={1}
                    value={disk.capacityGb}
                    onChange={(event) =>
                      updateDisk(index, { capacityGb: Number(event.target.value) })
                    }
                    className={`${inputClass} py-1.5 text-sm`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Tipo</span>
                  <select
                    value={disk.diskType}
                    onChange={(event) =>
                      updateDisk(index, { diskType: event.target.value as DiskType })
                    }
                    className={`${inputClass} py-1.5 text-sm`}
                  >
                    {DISK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {DISK_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Uso</span>
                  <select
                    value={disk.purpose}
                    onChange={(event) =>
                      updateDisk(index, { purpose: event.target.value as DiskPurpose })
                    }
                    className={`${inputClass} py-1.5 text-sm`}
                  >
                    {DISK_PURPOSES.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {DISK_PURPOSE_LABELS[purpose]}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="ghost-danger"
                  size="sm"
                  onClick={() => removeDisk(index)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">Sistema Operacional</legend>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">SO</span>
              <input
                value={form.osName}
                onChange={(event) => setField('osName', event.target.value)}
                placeholder="Ubuntu"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Versao</span>
              <input
                value={form.osVersion}
                onChange={(event) => setField('osVersion', event.target.value)}
                placeholder="22.04"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Arquitetura</span>
              <input
                value={form.osArchitecture}
                onChange={(event) => setField('osArchitecture', event.target.value)}
                placeholder="x86_64"
                className={inputClass}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">Redes</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">IPs privados (separados por virgula)</span>
              <input
                value={form.privateIps}
                onChange={(event) => setField('privateIps', event.target.value)}
                placeholder="10.0.0.5, 10.0.0.6"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">IP publico</span>
              <input
                value={form.publicIp}
                onChange={(event) => setField('publicIp', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">VLAN/Subnet</span>
              <input
                value={form.vlanSubnet}
                onChange={(event) => setField('vlanSubnet', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Gateway</span>
              <input
                value={form.gateway}
                onChange={(event) => setField('gateway', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Servidores DNS (separados por virgula)</span>
              <input
                value={form.dnsServers}
                onChange={(event) => setField('dnsServers', event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">Acesso / Seguranca</legend>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Metodo de acesso</span>
              <input
                value={form.accessMethod}
                onChange={(event) => setField('accessMethod', event.target.value)}
                placeholder="SSH, RDP..."
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Security Group</span>
              <input
                value={form.securityGroup}
                onChange={(event) => setField('securityGroup', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Classificacao de dados</span>
              <input
                value={form.dataClassification}
                onChange={(event) => setField('dataClassification', event.target.value)}
                placeholder="Confidencial..."
                className={inputClass}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">Ciclo de Vida</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Status *</span>
              <select
                value={form.status}
                onChange={(event) => setField('status', event.target.value as ServerStatus)}
                className={inputClass}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SERVER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Ambiente *</span>
              <select
                value={form.environment}
                onChange={(event) => setField('environment', event.target.value as ServerEnvironment)}
                className={inputClass}
              >
                {ENVIRONMENTS.map((environment) => (
                  <option key={environment} value={environment}>
                    {ENVIRONMENT_LABELS[environment]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">
            Responsabilidade / Backup / Custos
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Time responsavel</span>
              <input
                value={form.ownerTeam}
                onChange={(event) => setField('ownerTeam', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Centro de custo</span>
              <input
                value={form.costCenter}
                onChange={(event) => setField('costCenter', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Politica de backup</span>
              <input
                value={form.backupPolicy}
                onChange={(event) => setField('backupPolicy', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Custo mensal estimado (R$)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.monthlyCostEstimate}
                onChange={(event) => setField('monthlyCostEstimate', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">URL de monitoramento</span>
              <input
                value={form.monitoringUrl}
                onChange={(event) => setField('monitoringUrl', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.hasBackup}
                onChange={(event) => setField('hasBackup', event.target.checked)}
                className="rounded border-slate-700 bg-slate-950"
              />
              Possui backup
            </label>
          </div>
        </fieldset>

        {mutation.isError && (
          <ErrorMessage
            message={
              mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar servidor'
            }
          />
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Salvando...'
              : isEditMode
                ? 'Salvar alteracoes'
                : 'Criar servidor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
