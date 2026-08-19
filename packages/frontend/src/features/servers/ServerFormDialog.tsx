import { type FormEvent, useEffect, useRef, useState, useCallback } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { ServiceEditModal, type ServiceInput } from './ServiceEditModal';
import { TagInput } from '../../shared/components/TagInput';
import { Tabs, type TabItem } from '../../shared/components/Tabs';
import {
  DISK_PURPOSE_LABELS,
  DISK_TYPE_LABELS,
  SERVER_STATUS_LABELS,
} from '../../shared/constants/labels';
import { useEnvironments } from '../environments/use-environments';
import { useServerTypes } from '../server-types/use-server-types';
import { useTeams } from '../teams/use-teams';

import type { ServerDiskInput } from './use-create-server';
import { useCreateServer } from './use-create-server';
import type {
  DiskPurpose,
  DiskType,
  ServerEnvironment,
  ServerStatus,
  ServerSummary,
  ServerType,
} from './use-servers';
import { useUpdateServer } from './use-update-server';

const HOSTNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const STATUSES = Object.keys(SERVER_STATUS_LABELS) as ServerStatus[];
const DISK_TYPES = Object.keys(DISK_TYPE_LABELS) as DiskType[];
const DISK_PURPOSES = Object.keys(DISK_PURPOSE_LABELS) as DiskPurpose[];

type TabKey =
  | 'identification'
  | 'hardware'
  | 'network'
  | 'services'
  | 'observations'
  | 'responsible';

const TABS: TabItem[] = [
  { key: 'identification', label: 'Identificacao' },
  { key: 'hardware', label: 'Hardware & SO' },
  { key: 'network', label: 'Redes & Acesso' },
  { key: 'services', label: 'Servicos' },
  { key: 'observations', label: 'Observacoes' },
  { key: 'responsible', label: 'Responsaveis' },
];

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
  serverType: ServerType;
  hypervisor: string;
  environment: ServerEnvironment;
  status: ServerStatus;
  description: string;
  cpuCores: string;
  ramGb: string;
  osName: string;
  osVersion: string;
  privateIps: string;
  publicIp: string;
  domain: string;
  fqdn: string;
  accessMethod: string;
  accessUser: string;
  observations: string;
  displayGroup: string;
  ownerTeamSlugs: string[];
}


function emptyForm(): FormState {
  return {
    hostname: '',
    displayName: '',
    serverType: 'vm',
    hypervisor: '',
    environment: 'production',
    status: 'active',
    description: '',
    cpuCores: '',
    ramGb: '',
    osName: '',
    osVersion: '',
    privateIps: '',
    publicIp: '',
    domain: '',
    fqdn: '',
    accessMethod: '',
    accessUser: '',
    observations: '',
    displayGroup: '',
    ownerTeamSlugs: [],
  };
}

function formFromServer(server: ServerSummary): FormState {
  return {
    hostname: server.hostname,
    displayName: server.displayName ?? '',
    serverType: server.serverType,
    hypervisor: server.hypervisor ?? '',
    environment: server.environment,
    status: server.status,
    description: server.description ?? '',
    cpuCores: server.cpuCores?.toString() ?? '',
    ramGb: server.ramGb?.toString() ?? '',
    osName: server.osName ?? '',
    osVersion: server.osVersion ?? '',
    privateIps: server.privateIps.join(', '),
    publicIp: server.publicIp ?? '',
    domain: server.domain ?? '',
    fqdn: server.fqdn ?? '',
    accessMethod: server.accessMethod ?? '',
    accessUser: server.accessUser ?? '',
    observations: server.observations ?? '',
    displayGroup: server.displayGroup ?? '',
    ownerTeamSlugs: server.ownerTeam ? server.ownerTeam.split(',').map((s) => s.trim()).filter(Boolean) : [],
  };
}

function servicesFromServer(server: ServerSummary): ServiceInput[] {
  return server.services.map((svc) => ({
    seq: svc.seq,
    name: svc.name,
    commandStart: svc.commandStart ?? '',
    commandStop: svc.commandStop ?? '',
    commandStatus: svc.commandStatus ?? '',
    ports: (svc.ports ?? []).join(', '),
    status: svc.status,
    observations: svc.observations ?? '',
  }));
}

export function ServerFormDialog({
  isOpen,
  onClose,
  server,
  duplicateFrom,
}: {
  isOpen: boolean;
  onClose: () => void;
  server?: ServerSummary | null;
  duplicateFrom?: ServerSummary | null;
}) {
  const isEditMode = Boolean(server);
  const isDuplicateMode = Boolean(duplicateFrom);
  const createServer = useCreateServer();
  const updateServer = useUpdateServer();
  const mutation = isEditMode ? updateServer : createServer;
  const { data: environments } = useEnvironments();
  const { data: serverTypes } = useServerTypes();
  const { data: teams = [] } = useTeams();

  const [activeTab, setActiveTab] = useState<TabKey>('identification');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [disks, setDisks] = useState<ServerDiskInput[]>([]);
  const [services, setServices] = useState<ServiceInput[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [hostnameError, setHostnameError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<{ service: ServiceInput; index: number | null } | null>(null);
  const nextSeqRef = useRef(1);

  useEffect(() => {
    if (isOpen) {
      const source = server ?? duplicateFrom ?? null;
      setActiveTab('identification');
      setForm(source ? formFromServer(source) : emptyForm());
      setDisks(
        source?.disks.map((disk) => ({
          mountPoint: disk.mountPoint,
          capacityGb: disk.capacityGb,
          diskType: disk.diskType,
          purpose: disk.purpose,
        })) ?? [],
      );
      const existingServices = source ? servicesFromServer(source) : [];
      setServices(existingServices);
      nextSeqRef.current =
        existingServices.length > 0
          ? Math.max(...existingServices.map((s) => s.seq)) + 1
          : 1;
      setTags(source?.tags ?? []);
      setEditingService(null);
      setHostnameError(null);
      createServer.reset();
      updateServer.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, server, duplicateFrom]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  // ── Discos ────────────────────────────────────────────────────────────────

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

  // ── Serviços ──────────────────────────────────────────────────────────────

  function openAddService(): void {
    const seq = nextSeqRef.current++;
    setEditingService({ service: { seq, name: '', commandStart: '', commandStop: '', commandStatus: '', ports: '', status: 'active', observations: '' }, index: null });
  }

  function openEditService(svc: ServiceInput, index: number): void {
    setEditingService({ service: svc, index });
  }

  const saveService = useCallback((updated: ServiceInput, index: number | null) => {
    if (index === null) {
      setServices((current) => [...current, updated]);
    } else {
      setServices((current) => current.map((s, i) => (i === index ? updated : s)));
    }
    setEditingService(null);
  }, []);

  function removeService(index: number): void {
    setServices((current) => current.filter((_, i) => i !== index));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleClose(): void {
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!HOSTNAME_PATTERN.test(form.hostname)) {
      setHostnameError('O hostname deve conter apenas letras, numeros, ponto, hifen e underscore');
      setActiveTab('identification');
      return;
    }
    setHostnameError(null);

    const payload = {
      hostname: form.hostname,
      displayName: form.displayName.trim() || null,
      serverType: form.serverType,
      provider: 'on_premise' as const,
      hypervisor: form.serverType === 'vm' ? (form.hypervisor.trim() || null) : null,
      environment: form.environment,
      status: form.status,
      description: form.description.trim() || null,
      cpuCores: form.cpuCores ? Number(form.cpuCores) : null,
      ramGb: form.ramGb ? Number(form.ramGb) : null,
      osName: form.osName.trim() || null,
      osVersion: form.osVersion.trim() || null,
      privateIps: csvToList(form.privateIps),
      publicIp: form.publicIp.trim() || null,
      domain: form.domain.trim() || null,
      fqdn: form.fqdn.trim() || null,
      accessMethod: form.accessMethod.trim() || null,
      accessUser: form.accessUser.trim() || null,
      observations: form.observations.trim() || null,
      displayGroup: form.displayGroup.trim() || null,
      tags: tags.map((t) => t.trim()).filter(Boolean),
      services: services.map((svc) => ({
        seq: svc.seq,
        name: svc.name.trim(),
        commandStart: svc.commandStart.trim() || null,
        commandStop: svc.commandStop.trim() || null,
        commandStatus: svc.commandStatus.trim() || null,
        ports: csvToList(svc.ports).map(Number).filter((n) => n >= 1 && n <= 65535),
        status: svc.status,
        observations: svc.observations.trim() || null,
      })),
      ownerTeam: form.ownerTeamSlugs.join(',') || null,
      disks,
    };

    if (isEditMode && server) {
      updateServer.mutate({ id: server.id, ...payload }, { onSuccess: handleClose });
      return;
    }

    createServer.mutate(payload, { onSuccess: handleClose });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {editingService && (
        <ServiceEditModal
          service={editingService.service}
          index={editingService.index}
          isWindows={form.osName.toLowerCase().includes('windows')}
          onSave={saveService}
          onCancel={() => setEditingService(null)}
        />
      )}
    <Modal
      title={isEditMode ? 'Editar Servidor' : isDuplicateMode ? 'Duplicar Servidor' : 'Incluir Servidor'}
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

        <div className="flex max-h-[55vh] flex-col gap-5 overflow-y-auto pr-1">
          {/* ── Identificacao ─────────────────────────────────────────────── */}
          {activeTab === 'identification' && (
            <fieldset className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Hostname *</span>
                <input
                  required
                  disabled={isEditMode}
                  value={form.hostname}
                  onChange={(event) => {
                    setField('hostname', event.target.value);
                    if (hostnameError) setHostnameError(null);
                  }}
                  onBlur={(event) => {
                    const val = event.target.value;
                    if (val && !HOSTNAME_PATTERN.test(val)) {
                      setHostnameError('O hostname deve conter apenas letras, numeros, ponto, hifen e underscore');
                    } else {
                      setHostnameError(null);
                    }
                  }}
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
                <span className="text-slate-400">Grupo (ecossistema)</span>
                <input
                  value={form.displayGroup}
                  onChange={(event) => setField('displayGroup', event.target.value)}
                  placeholder="Ex: License Server, PASOE + TOMCAT..."
                  className={inputClass}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Tipo *</span>
                  <select
                    value={form.serverType}
                    onChange={(event) => {
                      const newType = event.target.value as ServerType;
                      setField('serverType', newType);
                      if (newType !== 'vm') setField('hypervisor', '');
                    }}
                    className={inputClass}
                  >
                    {(serverTypes ?? []).map((type) => (
                      <option key={type.slug} value={type.slug}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span
                    className={`text-slate-400 ${form.serverType !== 'vm' ? 'opacity-40' : ''}`}
                  >
                    Hypervisor
                  </span>
                  <input
                    value={form.hypervisor}
                    disabled={form.serverType !== 'vm'}
                    onChange={(event) => setField('hypervisor', event.target.value)}
                    placeholder="VMware, KVM..."
                    className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-40`}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Ambiente *</span>
                  <select
                    value={form.environment}
                    onChange={(event) =>
                      setField('environment', event.target.value as ServerEnvironment)
                    }
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
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Descricao</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </label>
            </fieldset>
          )}

          {/* ── Hardware & SO ─────────────────────────────────────────────── */}
          {activeTab === 'hardware' && (
            <fieldset className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <div
                    key={index}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-end gap-2"
                  >
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
          )}

          {/* ── Redes & Acesso ────────────────────────────────────────────── */}
          {activeTab === 'network' && (
            <fieldset className="flex flex-col gap-3">
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
                  <span className="text-slate-400">Dominio</span>
                  <input
                    value={form.domain}
                    onChange={(event) => setField('domain', event.target.value)}
                    placeholder="example.com"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">Nome (FQDN)</span>
                  <input
                    value={form.fqdn}
                    onChange={(event) => setField('fqdn', event.target.value)}
                    placeholder="web-01.example.com"
                    className={inputClass}
                  />
                </label>
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
                  <span className="text-slate-400">Usuario de acesso</span>
                  <input
                    value={form.accessUser}
                    onChange={(event) => setField('accessUser', event.target.value)}
                    placeholder="admin, deploy..."
                    className={inputClass}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {/* ── Servicos ──────────────────────────────────────────────────── */}
          {activeTab === 'services' && (
            <fieldset className="flex flex-col gap-3">
              {form.osName.toLowerCase().includes('windows') && (
                <div className="rounded-md border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
                  <span className="font-medium text-slate-300">Sistema Windows detectado.</span>{' '}
                  Os servicos sao gerenciados pelo painel de controle do Windows:{' '}
                  <span className="font-mono text-slate-300">services.msc</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {services.length === 0 ? 'Nenhum servico cadastrado.' : `${services.length} servico(s)`}
                </span>
                <Button type="button" variant="secondary" size="sm" onClick={openAddService}>
                  + Servico
                </Button>
              </div>
              {services.length > 0 && (
                <div className="flex flex-col gap-2">
                  {services.map((svc, index) => (
                    <div
                      key={svc.seq}
                      className="flex items-center gap-3 rounded-md border border-slate-800 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-slate-500 shrink-0">
                        #{String(svc.seq).padStart(3, '0')}
                      </span>
                      <span className="flex-1 text-sm text-slate-100 truncate">
                        {svc.name || <span className="text-slate-500 italic">sem nome</span>}
                      </span>
                      {svc.ports && (
                        <span className="shrink-0 font-mono text-xs text-slate-500">{svc.ports}</span>
                      )}
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          svc.status === 'active'
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {svc.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditService(svc, index)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost-danger"
                        size="sm"
                        onClick={() => removeService(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {/* ── Observacoes ───────────────────────────────────────────────── */}
          {activeTab === 'observations' && (
            <fieldset className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Observacoes do servidor</span>
                <textarea
                  value={form.observations}
                  onChange={(event) => setField('observations', event.target.value)}
                  rows={5}
                  placeholder="Anotacoes, particularidades, historico..."
                  className={inputClass}
                />
              </label>

              <div className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Tags</span>
                <TagInput tags={tags} onChange={setTags} placeholder="linux, prod..." />
              </div>
            </fieldset>
          )}

          {/* ── Responsaveis ──────────────────────────────────────────────── */}
          {activeTab === 'responsible' && (
            <fieldset className="flex flex-col gap-3">
              <span className="text-sm text-slate-400">Equipes responsaveis</span>
              {teams.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum time cadastrado.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {teams.map((team) => {
                    const checked = form.ownerTeamSlugs.includes(team.slug);
                    return (
                      <label key={team.slug} className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-800 px-3 py-2 hover:bg-slate-900/60">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setField(
                              'ownerTeamSlugs',
                              checked
                                ? form.ownerTeamSlugs.filter((s) => s !== team.slug)
                                : [...form.ownerTeamSlugs, team.slug],
                            );
                          }}
                          className="h-4 w-4 accent-sky-500"
                        />
                        <span className="text-sm text-slate-200">{team.name}</span>
                        {team.description && (
                          <span className="ml-auto text-xs text-slate-500">{team.description}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          )}
        </div>

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
    </>
  );
}
