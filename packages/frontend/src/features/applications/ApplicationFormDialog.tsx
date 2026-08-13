import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import {
  APP_TYPE_LABELS,
  APPLICATION_STATUS_LABELS,
  CRITICALITY_LABELS,
  ENVIRONMENT_LABELS,
} from '../../shared/constants/labels';
import { useServers } from '../servers/use-servers';

import type { ApplicationStatus, ApplicationSummary, AppType, Criticality, DeployEnvironment } from './use-applications';
import { useApplications } from './use-applications';
import type { DeploymentInput } from './use-create-application';
import { useCreateApplication } from './use-create-application';
import { useUpdateApplication } from './use-update-application';

const CODE_PATTERN = /^[a-z0-9._-]+$/;
const APP_TYPES = Object.keys(APP_TYPE_LABELS) as AppType[];
const CRITICALITIES = Object.keys(CRITICALITY_LABELS) as Criticality[];
const STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[];
const ENVIRONMENTS = Object.keys(ENVIRONMENT_LABELS) as DeployEnvironment[];

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

interface FormState {
  code: string;
  displayName: string;
  description: string;
  appType: AppType;
  businessCategory: string;
  criticality: Criticality;
  status: ApplicationStatus;
  language: string;
  framework: string;
  currentVersion: string;
  repositoryUrl: string;
  cicdUrl: string;
  containerImage: string;
  dataClassification: string;
  authMethod: string;
  ownerTeam: string;
  costCenter: string;
  monthlyCostEstimate: string;
  docsUrl: string;
  apiSpecUrl: string;
  runbookUrl: string;
  monitoringUrl: string;
  sla: string;
  healthCheckUrl: string;
}

function emptyForm(): FormState {
  return {
    code: '',
    displayName: '',
    description: '',
    appType: 'api_backend',
    businessCategory: '',
    criticality: 'medium',
    status: 'active',
    language: '',
    framework: '',
    currentVersion: '',
    repositoryUrl: '',
    cicdUrl: '',
    containerImage: '',
    dataClassification: '',
    authMethod: '',
    ownerTeam: '',
    costCenter: '',
    monthlyCostEstimate: '',
    docsUrl: '',
    apiSpecUrl: '',
    runbookUrl: '',
    monitoringUrl: '',
    sla: '',
    healthCheckUrl: '',
  };
}

function formFromApplication(application: ApplicationSummary): FormState {
  return {
    code: application.code,
    displayName: application.displayName,
    description: application.description ?? '',
    appType: application.appType,
    businessCategory: application.businessCategory ?? '',
    criticality: application.criticality,
    status: application.status,
    language: application.language ?? '',
    framework: application.framework ?? '',
    currentVersion: application.currentVersion ?? '',
    repositoryUrl: application.repositoryUrl ?? '',
    cicdUrl: application.cicdUrl ?? '',
    containerImage: application.containerImage ?? '',
    dataClassification: application.dataClassification ?? '',
    authMethod: application.authMethod ?? '',
    ownerTeam: application.ownerTeam ?? '',
    costCenter: application.costCenter ?? '',
    monthlyCostEstimate: application.monthlyCostEstimate?.toString() ?? '',
    docsUrl: application.docsUrl ?? '',
    apiSpecUrl: application.apiSpecUrl ?? '',
    runbookUrl: application.runbookUrl ?? '',
    monitoringUrl: application.monitoringUrl ?? '',
    sla: application.sla ?? '',
    healthCheckUrl: application.healthCheckUrl ?? '',
  };
}

export function ApplicationFormDialog({
  isOpen,
  onClose,
  application,
}: {
  isOpen: boolean;
  onClose: () => void;
  application?: ApplicationSummary | null;
}) {
  const isEditMode = Boolean(application);
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const mutation = isEditMode ? updateApplication : createApplication;

  const servers = useServers();
  const applications = useApplications();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [deployments, setDeployments] = useState<DeploymentInput[]>([]);
  const [dependsOnIds, setDependsOnIds] = useState<string[]>([]);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(application ? formFromApplication(application) : emptyForm());
      setDeployments(
        application?.deployments.map((deployment) => ({
          serverId: deployment.serverId,
          environment: deployment.environment,
          deployMethod: deployment.deployMethod,
          accessUrl: deployment.accessUrl,
          deployedVersion: deployment.deployedVersion,
        })) ?? [],
      );
      setDependsOnIds(application?.dependsOn.map((dep) => dep.id) ?? []);
      setCodeError(null);
      createApplication.reset();
      updateApplication.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, application]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addDeployment(): void {
    const firstServerId = servers.data?.items[0]?.id ?? '';
    setDeployments((current) => [
      ...current,
      { serverId: firstServerId, environment: 'production' },
    ]);
  }

  function updateDeployment(index: number, patch: Partial<DeploymentInput>): void {
    setDeployments((current) =>
      current.map((deployment, i) => (i === index ? { ...deployment, ...patch } : deployment)),
    );
  }

  function removeDeployment(index: number): void {
    setDeployments((current) => current.filter((_, i) => i !== index));
  }

  function toggleDependency(id: string): void {
    setDependsOnIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function handleClose(): void {
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!isEditMode && !CODE_PATTERN.test(form.code)) {
      setCodeError('O codigo deve conter apenas letras minusculas, numeros, ponto, hifen e underscore');
      return;
    }
    setCodeError(null);

    const payload = {
      code: form.code,
      displayName: form.displayName,
      description: form.description.trim() || null,
      appType: form.appType,
      businessCategory: form.businessCategory.trim() || null,
      criticality: form.criticality,
      status: form.status,
      language: form.language.trim() || null,
      framework: form.framework.trim() || null,
      currentVersion: form.currentVersion.trim() || null,
      repositoryUrl: form.repositoryUrl.trim() || null,
      cicdUrl: form.cicdUrl.trim() || null,
      containerImage: form.containerImage.trim() || null,
      dataClassification: form.dataClassification.trim() || null,
      authMethod: form.authMethod.trim() || null,
      ownerTeam: form.ownerTeam.trim() || null,
      costCenter: form.costCenter.trim() || null,
      monthlyCostEstimate: form.monthlyCostEstimate ? Number(form.monthlyCostEstimate) : null,
      docsUrl: form.docsUrl.trim() || null,
      apiSpecUrl: form.apiSpecUrl.trim() || null,
      runbookUrl: form.runbookUrl.trim() || null,
      monitoringUrl: form.monitoringUrl.trim() || null,
      sla: form.sla.trim() || null,
      healthCheckUrl: form.healthCheckUrl.trim() || null,
      deployments: deployments.filter((deployment) => deployment.serverId),
      dependsOnIds,
    };

    if (isEditMode && application) {
      updateApplication.mutate({ id: application.id, ...payload }, { onSuccess: handleClose });
      return;
    }

    createApplication.mutate(payload, { onSuccess: handleClose });
  }

  const availableApplications = (applications.data?.items ?? []).filter(
    (item) => item.id !== application?.id,
  );

  return (
    <Modal
      title={isEditMode ? 'Editar Aplicacao' : 'Incluir Aplicacao'}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">Identificacao</legend>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Codigo *</span>
            <input
              required
              disabled={isEditMode}
              value={form.code}
              onChange={(event) => setField('code', event.target.value)}
              placeholder="billing-api"
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
            />
            {codeError && <span className="text-xs text-red-400">{codeError}</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Nome amigavel *</span>
            <input
              required
              value={form.displayName}
              onChange={(event) => setField('displayName', event.target.value)}
              placeholder="Billing API"
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
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Tipo *</span>
              <select
                value={form.appType}
                onChange={(event) => setField('appType', event.target.value as AppType)}
                className={inputClass}
              >
                {APP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {APP_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Criticidade</span>
              <select
                value={form.criticality}
                onChange={(event) => setField('criticality', event.target.value as Criticality)}
                className={inputClass}
              >
                {CRITICALITIES.map((criticality) => (
                  <option key={criticality} value={criticality}>
                    {CRITICALITY_LABELS[criticality]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Status</span>
              <select
                value={form.status}
                onChange={(event) => setField('status', event.target.value as ApplicationStatus)}
                className={inputClass}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {APPLICATION_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Categoria de negocio</span>
            <input
              value={form.businessCategory}
              onChange={(event) => setField('businessCategory', event.target.value)}
              className={inputClass}
            />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">Tecnologia</legend>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Linguagem</span>
              <input
                value={form.language}
                onChange={(event) => setField('language', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Framework</span>
              <input
                value={form.framework}
                onChange={(event) => setField('framework', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Versao atual</span>
              <input
                value={form.currentVersion}
                onChange={(event) => setField('currentVersion', event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Repositorio</span>
              <input
                value={form.repositoryUrl}
                onChange={(event) => setField('repositoryUrl', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">CI/CD</span>
              <input
                value={form.cicdUrl}
                onChange={(event) => setField('cicdUrl', event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Imagem/Registry</span>
            <input
              value={form.containerImage}
              onChange={(event) => setField('containerImage', event.target.value)}
              className={inputClass}
            />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-slate-300">Implantacoes</legend>
          <div className="flex flex-col gap-2 rounded-md border border-slate-800 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Servidores onde esta implantada</span>
              <Button type="button" variant="secondary" size="sm" onClick={addDeployment}>
                + Implantacao
              </Button>
            </div>
            {deployments.length === 0 && (
              <p className="text-xs text-slate-500">Nenhuma implantacao adicionada.</p>
            )}
            {deployments.map((deployment, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-2">
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Servidor</span>
                  <select
                    value={deployment.serverId}
                    onChange={(event) => updateDeployment(index, { serverId: event.target.value })}
                    className={`${inputClass} py-1.5 text-sm`}
                  >
                    <option value="">Selecione...</option>
                    {(servers.data?.items ?? []).map((server) => (
                      <option key={server.id} value={server.id}>
                        {server.hostname}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Ambiente</span>
                  <select
                    value={deployment.environment}
                    onChange={(event) =>
                      updateDeployment(index, { environment: event.target.value as DeployEnvironment })
                    }
                    className={`${inputClass} py-1.5 text-sm`}
                  >
                    {ENVIRONMENTS.map((environment) => (
                      <option key={environment} value={environment}>
                        {ENVIRONMENT_LABELS[environment]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Versao</span>
                  <input
                    value={deployment.deployedVersion ?? ''}
                    onChange={(event) =>
                      updateDeployment(index, { deployedVersion: event.target.value })
                    }
                    className={`${inputClass} py-1.5 text-sm`}
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost-danger"
                  size="sm"
                  onClick={() => removeDeployment(index)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </fieldset>

        {availableApplications.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-slate-300">
              Dependencias (aplicacoes das quais esta depende)
            </legend>
            <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-md border border-slate-800 p-3">
              {availableApplications.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={dependsOnIds.includes(item.id)}
                    onChange={() => toggleDependency(item.id)}
                    className="rounded border-slate-700 bg-slate-950"
                  />
                  {item.displayName} ({item.code})
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-slate-300">
            Governanca / Documentacao
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
              <span className="text-slate-400">Documentacao</span>
              <input
                value={form.docsUrl}
                onChange={(event) => setField('docsUrl', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Especificacao da API</span>
              <input
                value={form.apiSpecUrl}
                onChange={(event) => setField('apiSpecUrl', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Monitoramento</span>
              <input
                value={form.monitoringUrl}
                onChange={(event) => setField('monitoringUrl', event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">SLA</span>
              <input
                value={form.sla}
                onChange={(event) => setField('sla', event.target.value)}
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
          </div>
        </fieldset>

        {mutation.isError && (
          <ErrorMessage
            message={
              mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar aplicacao'
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
                : 'Criar aplicacao'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
