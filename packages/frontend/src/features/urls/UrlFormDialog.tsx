import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { useApplications } from '../applications/use-applications';
import {
  useCreateRelationship,
  useDeleteRelationship,
  useResourceRelationships,
} from '../resource-graph/use-resource-graph';
import { useUrls } from './use-urls';
import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';

import type { CreateUrlInput, UrlHttpMethod } from './use-create-url';
import { useCreateUrl } from './use-create-url';
import type { Url } from './use-urls';
import { useUpdateUrl } from './use-update-url';

const inputClass =
  'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500';

const URL_TYPES = ['api', 'frontend', 'monitoring', 'docs', 'webhook', 'cdn', 'download', 'api_external', 'internal'];
const HTTP_METHODS: UrlHttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const URL_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'deprecated', label: 'Descontinuado' },
  { value: 'error', label: 'Erro' },
];

interface FormState {
  label: string;
  url: string;
  urlType: string;
  description: string;
  method: UrlHttpMethod | '';
  authRequired: boolean;
  authMethod: string;
  status: string;
  healthcheckEnabled: boolean;
}

function emptyForm(): FormState {
  return {
    label: '',
    url: '',
    urlType: 'api',
    description: '',
    method: 'GET',
    authRequired: false,
    authMethod: '',
    status: 'active',
    healthcheckEnabled: false,
  };
}

function formFromUrl(url: Url): FormState {
  return {
    label: url.label,
    url: url.url,
    urlType: url.urlType,
    description: url.description ?? '',
    method: (url.method as UrlHttpMethod) ?? 'GET',
    authRequired: url.authRequired,
    authMethod: url.authMethod ?? '',
    status: url.status,
    healthcheckEnabled: url.healthcheckEnabled,
  };
}

export function UrlFormDialog({
  isOpen,
  onClose,
  url,
  prefill,
}: {
  isOpen: boolean;
  onClose: () => void;
  url?: Url | null;
  prefill?: Url | null;
}) {
  const isEditMode = Boolean(url);
  const createUrl = useCreateUrl();
  const updateUrl = useUpdateUrl();
  const createRelationship = useCreateRelationship();
  const deleteRelationship = useDeleteRelationship();
  const mutation = isEditMode ? updateUrl : createUrl;

  const { data: applicationsData } = useApplications();
  const { data: urlsData } = useUrls({ pageSize: 200 });

  // Existing depends_on relationships for this URL (edit mode only)
  const { data: existingRelationships } = useResourceRelationships(
    isOpen && url ? 'url' : null,
    url?.id ?? null,
    'depends_on',
  );

  const [form, setForm] = useState<FormState>(emptyForm());
  const [tags, setTags] = useState<string[]>([]);
  // IDs of applications this URL depends on
  const [dependsOnAppIds, setDependsOnAppIds] = useState<string[]>([]);
  // IDs of other URLs this URL depends on
  const [dependsOnUrlIds, setDependsOnUrlIds] = useState<string[]>([]);
  // Map from appId → relationshipId (to delete when unchecked in edit mode)
  const existingRelMapRef = useRef<Map<string, string>>(new Map());
  // Map from urlId → relationshipId for URL→URL dependencies
  const existingUrlRelMapRef = useRef<Map<string, string>>(new Map());

  const allApplications = useMemo(
    () => (applicationsData?.items ?? []).map((a) => ({ id: a.id, label: a.displayName ?? a.code })),
    [applicationsData],
  );

  const allUrls = useMemo(
    () => (urlsData?.items ?? [])
      .filter((u) => u.id !== url?.id)
      .map((u) => ({ id: u.id, label: u.label, urlValue: u.url })),
    [urlsData, url?.id],
  );

  // Populate form fields when dialog opens
  useEffect(() => {
    if (isOpen) {
      const base = url ? formFromUrl(url) : prefill ? formFromUrl(prefill) : emptyForm();
      setForm(base);
      setTags(url?.tags ?? prefill?.tags ?? []);
      setDependsOnAppIds([]);
      setDependsOnUrlIds([]);
      existingRelMapRef.current = new Map();
      existingUrlRelMapRef.current = new Map();
      createUrl.reset();
      updateUrl.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, url, prefill]);

  // When existing relationships load (edit mode), populate the dependency checkboxes
  useEffect(() => {
    if (isOpen && existingRelationships) {
      const appRels = existingRelationships.filter((r) => r.targetType === 'application');
      const urlRels = existingRelationships.filter((r) => r.targetType === 'url');
      setDependsOnAppIds(appRels.map((r) => r.targetId));
      setDependsOnUrlIds(urlRels.map((r) => r.targetId));
      existingRelMapRef.current = new Map(appRels.map((r) => [r.targetId, r.id]));
      existingUrlRelMapRef.current = new Map(urlRels.map((r) => [r.targetId, r.id]));
    }
  }, [isOpen, existingRelationships]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDependency(appId: string): void {
    setDependsOnAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId],
    );
  }

  function toggleDependencyUrl(targetUrlId: string): void {
    setDependsOnUrlIds((prev) =>
      prev.includes(targetUrlId) ? prev.filter((id) => id !== targetUrlId) : [...prev, targetUrlId],
    );
  }

  async function syncRelationships(urlId: string): Promise<void> {
    // App dependencies
    const oldAppMap = existingRelMapRef.current;
    const oldAppIds = new Set(oldAppMap.keys());
    const newAppIds = new Set(dependsOnAppIds);
    const appsToDelete = [...oldAppIds].filter((id) => !newAppIds.has(id));
    const appsToCreate = [...newAppIds].filter((id) => !oldAppIds.has(id));

    // URL dependencies
    const oldUrlMap = existingUrlRelMapRef.current;
    const oldUrlIds = new Set(oldUrlMap.keys());
    const newUrlIds = new Set(dependsOnUrlIds);
    const urlsToDelete = [...oldUrlIds].filter((id) => !newUrlIds.has(id));
    const urlsToCreate = [...newUrlIds].filter((id) => !oldUrlIds.has(id));

    await Promise.all([
      ...appsToDelete.map((appId) => deleteRelationship.mutateAsync(oldAppMap.get(appId)!)),
      ...appsToCreate.map((appId) =>
        createRelationship.mutateAsync({
          sourceType: 'url',
          sourceId: urlId,
          targetType: 'application',
          targetId: appId,
          relationType: 'depends_on',
        }),
      ),
      ...urlsToDelete.map((targetId) => deleteRelationship.mutateAsync(oldUrlMap.get(targetId)!)),
      ...urlsToCreate.map((targetId) =>
        createRelationship.mutateAsync({
          sourceType: 'url',
          sourceId: urlId,
          targetType: 'url',
          targetId,
          relationType: 'depends_on',
        }),
      ),
    ]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const payload: CreateUrlInput = {
      label: form.label.trim(),
      url: form.url.trim(),
      urlType: form.urlType,
      description: form.description.trim() || null,
      method: form.method || null,
      authRequired: form.authRequired,
      authMethod: form.authMethod.trim() || null,
      status: form.status,
      healthcheckEnabled: form.healthcheckEnabled,
      tags: tags.map((t) => t.trim()).filter(Boolean),
    };

    try {
      let urlId: string;
      if (isEditMode && url) {
        await updateUrl.mutateAsync({ id: url.id, ...payload });
        urlId = url.id;
      } else {
        const created = await createUrl.mutateAsync(payload);
        urlId = created.id;
      }
      await syncRelationships(urlId);
      onClose();
    } catch {
      // errors surfaced via mutation.isError
    }
  }

  return (
    <Modal
      title={isEditMode ? 'Editar URL' : prefill ? 'Duplicar URL' : 'Incluir URL'}
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
              <span className="text-slate-400">Label *</span>
              <input
                required
                value={form.label}
                onChange={(e) => setField('label', e.target.value)}
                placeholder="API de Pagamentos — Producao"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">URL *</span>
              <input
                required
                value={form.url}
                onChange={(e) => setField('url', e.target.value)}
                placeholder="lstotvs.unimedpoa.com.br ou https://api.example.com"
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Tipo *</span>
                <select
                  value={form.urlType}
                  onChange={(e) => setField('urlType', e.target.value)}
                  className={inputClass}
                >
                  {URL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
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
                  {URL_STATUSES.map((s) => (
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

          {/* Depende de (aplicacoes) */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Depende de
            </legend>
            <p className="text-xs text-slate-500">
              Selecione as aplicacoes que esta URL precisa para funcionar. Se alguma cair, esta URL sera impactada.
            </p>
            {allApplications.length === 0 ? (
              <p className="text-xs text-slate-600">Nenhuma aplicacao cadastrada.</p>
            ) : (
              <div className="flex flex-col gap-1 rounded-md border border-slate-800 p-2">
                {allApplications.map((app) => {
                  const checked = dependsOnAppIds.includes(app.id);
                  return (
                    <label
                      key={app.id}
                      className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-slate-900/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDependency(app.id)}
                        className="h-4 w-4 accent-sky-500"
                      />
                      <span className="text-sm text-slate-200">{app.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

          {/* Depende de (outras URLs) */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Depende de (URLs)
            </legend>
            <p className="text-xs text-slate-500">
              Selecione as URLs que esta URL precisa para funcionar — ex: um VIP que depende de um servico de licenca.
            </p>
            {allUrls.length === 0 ? (
              <p className="text-xs text-slate-600">Nenhuma outra URL cadastrada.</p>
            ) : (
              <div className="flex flex-col gap-1 rounded-md border border-slate-800 p-2">
                {allUrls.map((u) => {
                  const checked = dependsOnUrlIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-slate-900/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDependencyUrl(u.id)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <span className="text-sm text-slate-200">{u.label}</span>
                      <span className="ml-auto text-xs text-slate-500 truncate max-w-[140px]">{u.urlValue}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

          {/* HTTP & Auth */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              HTTP & Autenticacao
            </legend>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Metodo HTTP</span>
              <select
                value={form.method}
                onChange={(e) => setField('method', e.target.value as UrlHttpMethod)}
                className={inputClass}
              >
                <option value="">— Nao especificado —</option>
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="authRequired"
                checked={form.authRequired}
                onChange={(e) => setField('authRequired', e.target.checked)}
                className="h-4 w-4 accent-sky-500"
              />
              <label htmlFor="authRequired" className="cursor-pointer text-sm text-slate-400">
                Requer autenticacao
              </label>
            </div>
            {form.authRequired && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400">Metodo de autenticacao</span>
                <input
                  value={form.authMethod}
                  onChange={(e) => setField('authMethod', e.target.value)}
                  placeholder="JWT, API Key, Basic Auth..."
                  className={inputClass}
                />
              </label>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="healthcheckEnabled"
                checked={form.healthcheckEnabled}
                onChange={(e) => setField('healthcheckEnabled', e.target.checked)}
                className="h-4 w-4 accent-sky-500"
              />
              <label htmlFor="healthcheckEnabled" className="cursor-pointer text-sm text-slate-400">
                Habilitar healthcheck automatico
              </label>
            </div>
          </fieldset>

          {/* Tags */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tags
            </legend>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Tags</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTags((prev) => [...prev, ''])}
              >
                + Tag
              </Button>
            </div>
            {tags.length === 0 && <p className="text-xs text-slate-500">Nenhuma tag adicionada.</p>}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-1">
                  <input
                    value={tag}
                    onChange={(e) =>
                      setTags((prev) => prev.map((t, i) => (i === index ? e.target.value : t)))
                    }
                    placeholder="api, producao..."
                    className={`${inputClass} w-32 py-1.5 text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((_, i) => i !== index))}
                    className="text-slate-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        {mutation.isError && (
          <ErrorMessage
            message={
              mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar URL'
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
                : prefill
                  ? 'Criar copia'
                  : 'Criar URL'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
