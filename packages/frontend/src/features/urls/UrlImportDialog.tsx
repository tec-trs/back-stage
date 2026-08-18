import { useCallback, useRef, useState } from 'react';

import type { CreateUrlInput, UrlHttpMethod } from './use-create-url';
import { useCreateUrl } from './use-create-url';
import { Button } from '../../shared/components/Button';
import { DownloadIcon, UploadIcon } from '../../shared/components/icons';
import { Modal } from '../../shared/components/Modal';

// --- Constants ---

const VALID_URL_TYPES: readonly string[] = ['api', 'web', 'healthcheck', 'webhook', 'documentation', 'other'];
const VALID_METHODS: readonly string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const VALID_STATUSES: readonly string[] = ['active', 'inactive', 'deprecated', 'error'];

const CSV_TEMPLATE = [
  'label,url,urlType,method,authRequired,authMethod,status,description',
  'Portal Clientes,https://portal.empresa.com,web,GET,true,oauth2,active,Portal de acesso de clientes',
  'API Pedidos v2,https://api.empresa.com/v2/pedidos,api,POST,true,jwt,active,Endpoint de criacao de pedidos',
  'Health API,https://api.empresa.com/health,healthcheck,GET,false,,active,Endpoint de health check',
].join('\n');

// --- Types ---

type Step = 'input' | 'preview' | 'importing' | 'done';

interface ParsedRow {
  lineNumber: number;
  label: string;
  url: string;
  urlType: string;
  errors: string[];
  data?: CreateUrlInput;
}

interface ImportResult {
  label: string;
  lineNumber: number;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

// --- CSV Parser ---

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      let j = i + 1;
      let field = '';
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') { field += '"'; j += 2; }
        else if (line[j] === '"') { j++; break; }
        else { field += line[j++]; }
      }
      cells.push(field.trim());
      i = j;
      if (line[i] === ',') i++;
    } else {
      const commaAt = line.indexOf(',', i);
      if (commaAt === -1) { cells.push(line.slice(i).trim()); break; }
      cells.push(line.slice(i, commaAt).trim());
      i = commaAt + 1;
    }
  }
  return cells;
}

function parseAndValidate(csvText: string): ParsedRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const col = (cells: string[], name: string): string => {
    const idx = headerCells.indexOf(name.toLowerCase());
    return idx >= 0 ? (cells[idx] ?? '').trim() : '';
  };

  return lines.slice(1).map((line, idx) => {
    const cells = parseCsvLine(line);
    const lineNumber = idx + 2;
    const errors: string[] = [];

    const label = col(cells, 'label');
    const url = col(cells, 'url');
    const urlType = col(cells, 'urltype');
    const method = col(cells, 'method');
    const status = col(cells, 'status');

    if (!label) errors.push('label obrigatorio');

    if (!url) {
      errors.push('url obrigatoria');
    } else {
      try { new URL(url); } catch { errors.push('url invalida — deve ser uma URL completa (ex: https://...)'); }
    }

    if (!urlType) {
      errors.push('urlType obrigatorio');
    } else if (!VALID_URL_TYPES.includes(urlType)) {
      errors.push(`urlType "${urlType}" invalido — use: ${VALID_URL_TYPES.join(', ')}`);
    }

    if (method && !VALID_METHODS.includes(method.toUpperCase())) {
      errors.push(`method "${method}" invalido — use: ${VALID_METHODS.join(', ')}`);
    }

    if (status && !VALID_STATUSES.includes(status)) {
      errors.push(`status "${status}" invalido — use: ${VALID_STATUSES.join(', ')}`);
    }

    if (errors.length > 0) {
      return { lineNumber, label, url, urlType, errors };
    }

    const authRequiredStr = col(cells, 'authrequired').toLowerCase();
    const data: CreateUrlInput = {
      label,
      url,
      urlType,
      method: method ? (method.toUpperCase() as UrlHttpMethod) : null,
      authRequired: authRequiredStr === 'true' || authRequiredStr === '1' || authRequiredStr === 'sim',
      authMethod: col(cells, 'authmethod') || null,
      status: status || 'active',
      description: col(cells, 'description') || null,
    };

    return { lineNumber, label, url, urlType, errors: [], data };
  });
}

// --- Component ---

interface UrlImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UrlImportDialog({ isOpen, onClose }: UrlImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createUrl = useCreateUrl();

  const [step, setStep] = useState<Step>('input');
  const [csvText, setCsvText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  function resetState(): void {
    setStep('input');
    setCsvText('');
    setIsDragOver(false);
    setParsedRows([]);
    setResults([]);
    setImportedCount(0);
    createUrl.reset();
  }

  function handleClose(): void {
    if (step === 'importing') return;
    onClose();
    setTimeout(resetState, 200);
  }

  function handleFileRead(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => setCsvText((e.target?.result as string) ?? '');
    reader.readAsText(file, 'utf-8');
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileRead(file);
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
    e.target.value = '';
  }

  function handlePreview(): void {
    setParsedRows(parseAndValidate(csvText));
    setStep('preview');
  }

  async function handleImport(): Promise<void> {
    const validRows = parsedRows.filter((r) => r.data != null);
    const initialResults: ImportResult[] = parsedRows.map((r) => ({
      label: r.label,
      lineNumber: r.lineNumber,
      status: r.data ? ('skipped' as const) : ('error' as const),
      error: r.errors[0],
    }));
    setResults(initialResults);
    setStep('importing');

    const liveResults = [...initialResults];
    let done = 0;

    for (const row of validRows) {
      if (!row.data) continue;
      try {
        await createUrl.mutateAsync(row.data);
        const i = liveResults.findIndex((r) => r.lineNumber === row.lineNumber);
        if (i >= 0) liveResults[i] = { ...liveResults[i], status: 'success' };
        done++;
      } catch (err) {
        const i = liveResults.findIndex((r) => r.lineNumber === row.lineNumber);
        if (i >= 0) {
          liveResults[i] = {
            ...liveResults[i],
            status: 'error',
            error: err instanceof Error ? err.message : 'Erro desconhecido',
          };
        }
      }
      setImportedCount(done);
      setResults([...liveResults]);
    }

    setStep('done');
  }

  function downloadTemplate(): void {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-importacao-urls.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const validCount = parsedRows.filter((r) => r.errors.length === 0).length;
  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length;
  const successCount = results.filter((r) => r.status === 'success').length;
  const failCount = results.filter(
    (r) => r.status === 'error' && !parsedRows.find((p) => p.lineNumber === r.lineNumber && p.errors.length > 0),
  ).length;
  const totalToImport = parsedRows.filter((r) => r.data != null).length;

  const modalTitle =
    step === 'input' ? 'Importar URLs em Massa'
    : step === 'preview' ? `Previa — ${parsedRows.length} linha(s)`
    : step === 'importing' ? 'Importando...'
    : 'Resultado da Importacao';

  return (
    <Modal title={modalTitle} isOpen={isOpen} onClose={handleClose} size="lg">

      {/* ── Step: input ── */}
      {step === 'input' && (
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-950/20'
                : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          >
            <UploadIcon className="text-3xl text-slate-400" />
            <p className="text-sm text-slate-300">Arraste um arquivo CSV ou clique para selecionar</p>
            <p className="text-xs text-slate-500">.csv ou .txt — codificacao UTF-8</p>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileInput} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Ou cole o conteudo CSV aqui:
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              placeholder={'label,url,urlType,method,status,...\nPortal,https://portal.empresa.com,web,GET,active,...'}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="rounded-md border border-slate-800 bg-slate-800/40 px-3 py-3 text-xs text-slate-400">
            <p className="mb-1 font-semibold text-slate-300">Colunas obrigatorias:</p>
            <p className="font-mono">label, url, urlType</p>
            <div className="mt-2 space-y-0.5">
              <p><span className="text-slate-300">urlType:</span> api | web | healthcheck | webhook | documentation | other</p>
            </div>
            <p className="mt-2 font-semibold text-slate-300">Colunas opcionais:</p>
            <p className="font-mono text-slate-500">method, authRequired, authMethod, status, description</p>
            <p className="mt-1"><span className="text-slate-300">authRequired:</span> true | false &nbsp; <span className="text-slate-300">method:</span> GET | POST | PUT | DELETE | PATCH</p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-blue-400 transition-colors hover:text-blue-300"
            >
              <DownloadIcon />
              Baixar modelo CSV
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleClose}>Cancelar</Button>
              <Button size="sm" disabled={!csvText.trim()} onClick={handlePreview}>Analisar arquivo</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          {parsedRows.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma linha encontrada. Verifique se o arquivo possui cabecalho e ao menos uma linha de dados.</p>
          ) : (
            <>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">{validCount} valido(s)</span>
                {errorCount > 0 && <span className="text-red-400">{errorCount} com erro(s)</span>}
              </div>
              <div className="max-h-72 overflow-y-auto rounded-md border border-slate-800">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-800">
                      <th className="px-3 py-2 text-left font-medium text-slate-400">#</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">Label</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">URL</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr key={row.lineNumber} className="border-b border-slate-800/50 last:border-0">
                        <td className="px-3 py-1.5 text-slate-500">{row.lineNumber}</td>
                        <td className="px-3 py-1.5 text-slate-200">{row.label || '—'}</td>
                        <td className="max-w-[200px] truncate px-3 py-1.5 font-mono text-slate-400" title={row.url}>{row.url || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-300">{row.urlType || '—'}</td>
                        <td className="px-3 py-1.5">
                          {row.errors.length === 0 ? (
                            <span className="text-green-400">✓ Valido</span>
                          ) : (
                            <span className="cursor-help text-red-400" title={row.errors.join('\n')}>
                              ✗ {row.errors[0]}{row.errors.length > 1 && ` (+${row.errors.length - 1})`}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="flex justify-between gap-2">
            <Button variant="secondary" size="sm" onClick={() => setStep('input')}>Voltar</Button>
            <Button size="sm" disabled={validCount === 0} onClick={() => void handleImport()}>
              Importar {validCount} URL(s)
            </Button>
          </div>
        </div>
      )}

      {/* ── Step: importing ── */}
      {step === 'importing' && (
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-300">Importando {importedCount} de {totalToImport}...</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: totalToImport > 0 ? `${(importedCount / totalToImport) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-slate-500">Nao feche esta janela enquanto a importacao estiver em andamento.</p>
        </div>
      )}

      {/* ── Step: done ── */}
      {step === 'done' && (
        <div className="space-y-4">
          <div className="flex gap-6 text-sm">
            <span className="text-green-400">{successCount} importado(s) com sucesso</span>
            {failCount > 0 && <span className="text-red-400">{failCount} com erro(s)</span>}
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border border-slate-800">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-800">
                  <th className="px-3 py-2 text-left font-medium text-slate-400">#</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">Label</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.lineNumber} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-3 py-1.5 text-slate-500">{r.lineNumber}</td>
                    <td className="px-3 py-1.5 text-slate-200">{r.label || '—'}</td>
                    <td className="px-3 py-1.5">
                      {r.status === 'success' ? (
                        <span className="text-green-400">✓ Importado</span>
                      ) : r.status === 'skipped' ? (
                        <span className="text-slate-500">— Ignorado</span>
                      ) : (
                        <span className="cursor-help text-red-400" title={r.error}>✗ {r.error ?? 'Erro'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleClose}>Fechar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
