import { useCallback, useRef, useState } from 'react';

import type { CreateServerInput } from './use-create-server';
import { useCreateServer } from './use-create-server';
import type { ServerEnvironment, ServerProvider, ServerType } from './use-servers';
import { Button } from '../../shared/components/Button';
import { DownloadIcon, UploadIcon } from '../../shared/components/icons';
import { Modal } from '../../shared/components/Modal';

// --- Constants ---

const VALID_SERVER_TYPES: readonly string[] = ['vm', 'bare_metal', 'container_host'];
const VALID_PROVIDERS: readonly string[] = ['on_premise', 'aws', 'azure', 'gcp', 'oracle_cloud', 'own_datacenter'];
const ENVIRONMENT_SLUG_RE = /^[a-z0-9_-]+$/;
const HOSTNAME_RE = /^[a-zA-Z0-9._-]+$/;

const CSV_TEMPLATE = [
  'hostname,displayName,serverType,provider,environment,ipAddress,domain,fqdn,osName,osVersion,cpuCores,ramGb,ownerTeam,description',
  'web-01.empresa.com,Web Server 01,vm,on_premise,production,10.0.0.1,empresa.com,web-01.empresa.com,Ubuntu,22.04,4,8,TI,Servidor web principal',
  'db-01.empresa.com,BD Produção,bare_metal,own_datacenter,production,192.168.1.10,,,RedHat,8.6,16,64,DBA,Banco de dados primário',
  'api-staging.empresa.com,,vm,aws,staging,,,,,,,,,API de homologacao',
].join('\n');

// --- Types ---

type Step = 'input' | 'preview' | 'importing' | 'done';

interface ParsedRow {
  lineNumber: number;
  hostname: string;
  serverType: string;
  provider: string;
  environment: string;
  errors: string[];
  data?: CreateServerInput;
}

interface ImportResult {
  hostname: string;
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
        if (line[j] === '"' && line[j + 1] === '"') {
          field += '"';
          j += 2;
        } else if (line[j] === '"') {
          j++;
          break;
        } else {
          field += line[j++];
        }
      }
      cells.push(field.trim());
      i = j;
      if (line[i] === ',') i++;
    } else {
      const commaAt = line.indexOf(',', i);
      if (commaAt === -1) {
        cells.push(line.slice(i).trim());
        break;
      }
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

    const hostname = col(cells, 'hostname');
    const serverType = col(cells, 'servertype');
    const provider = col(cells, 'provider');
    const environment = col(cells, 'environment');

    if (!hostname) {
      errors.push('hostname obrigatorio');
    } else if (!HOSTNAME_RE.test(hostname)) {
      errors.push('hostname invalido (use letras, numeros, ponto, hifen ou underscore)');
    }

    if (!serverType) {
      errors.push('serverType obrigatorio');
    } else if (!VALID_SERVER_TYPES.includes(serverType)) {
      errors.push(`serverType "${serverType}" invalido — use: ${VALID_SERVER_TYPES.join(', ')}`);
    }

    if (!provider) {
      errors.push('provider obrigatorio');
    } else if (!VALID_PROVIDERS.includes(provider)) {
      errors.push(`provider "${provider}" invalido — use: ${VALID_PROVIDERS.join(', ')}`);
    }

    if (!environment) {
      errors.push('environment obrigatorio');
    } else if (!ENVIRONMENT_SLUG_RE.test(environment)) {
      errors.push(`environment "${environment}" invalido — use letras minusculas, numeros, hifen ou underscore`);
    }

    const cpuCoresStr = col(cells, 'cpucores');
    const ramGbStr = col(cells, 'ramgb');
    const cpuCores = cpuCoresStr ? parseInt(cpuCoresStr, 10) : null;
    const ramGb = ramGbStr ? parseInt(ramGbStr, 10) : null;

    if (cpuCoresStr && (!Number.isInteger(cpuCores) || (cpuCores ?? 0) <= 0)) {
      errors.push('cpuCores deve ser um inteiro positivo');
    }
    if (ramGbStr && (!Number.isInteger(ramGb) || (ramGb ?? 0) <= 0)) {
      errors.push('ramGb deve ser um inteiro positivo');
    }

    if (errors.length > 0) {
      return { lineNumber, hostname, serverType, provider, environment, errors };
    }

    const ipAddress = col(cells, 'ipaddress');

    const data: CreateServerInput = {
      hostname,
      serverType: serverType as ServerType,
      provider: provider as ServerProvider,
      environment: environment as ServerEnvironment,
      displayName: col(cells, 'displayname') || null,
      description: col(cells, 'description') || null,
      domain: col(cells, 'domain') || null,
      fqdn: col(cells, 'fqdn') || null,
      osName: col(cells, 'osname') || null,
      osVersion: col(cells, 'osversion') || null,
      ownerTeam: col(cells, 'ownerteam') || null,
      cpuCores,
      ramGb,
      ...(ipAddress ? { privateIps: [ipAddress] } : {}),
    };

    return { lineNumber, hostname, serverType, provider, environment, errors: [], data };
  });
}

// --- Component ---

interface ServerImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServerImportDialog({ isOpen, onClose }: ServerImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createServer = useCreateServer();

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
    createServer.reset();
  }

  function handleClose(): void {
    if (step === 'importing') return;
    onClose();
    setTimeout(resetState, 200);
  }

  function handleFileRead(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCsvText((e.target?.result as string) ?? '');
    };
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
    const rows = parseAndValidate(csvText);
    setParsedRows(rows);
    setStep('preview');
  }

  async function handleImport(): Promise<void> {
    const validRows = parsedRows.filter((r) => r.data != null);
    const initialResults: ImportResult[] = parsedRows.map((r) => ({
      hostname: r.hostname,
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
        await createServer.mutateAsync(row.data);
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
    a.download = 'modelo-importacao-servidores.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const validCount = parsedRows.filter((r) => r.errors.length === 0).length;
  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length;
  const successCount = results.filter((r) => r.status === 'success').length;
  const failCount = results.filter((r) => r.status === 'error' && !parsedRows.find((p) => p.lineNumber === r.lineNumber && p.errors.length > 0)).length;
  const totalToImport = parsedRows.filter((r) => r.data != null).length;

  const modalTitle =
    step === 'input' ? 'Importar Servidores em Massa'
    : step === 'preview' ? `Previa — ${parsedRows.length} linha(s)`
    : step === 'importing' ? 'Importando...'
    : 'Resultado da Importacao';

  return (
    <Modal title={modalTitle} isOpen={isOpen} onClose={handleClose} size="lg">

      {/* ── Step: input ── */}
      {step === 'input' && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed p-8 transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-950/20'
                : 'border-line hover:border-slate-500 hover:bg-surface-raised/30'
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* Textarea */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Ou cole o conteudo CSV aqui:
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              placeholder={'hostname,serverType,provider,environment,...\nweb-01,vm,on_premise,production,...'}
              className="w-full rounded border border-line bg-surface-raised px-3 py-2 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-slate-500 focus:outline-none"
            />
          </div>

          {/* Format hint */}
          <div className="rounded border border-line bg-surface-raised/40 px-3 py-3 text-xs text-slate-400">
            <p className="mb-1 font-semibold text-slate-300">Colunas obrigatorias:</p>
            <p className="font-mono">hostname, serverType, provider, environment</p>
            <div className="mt-2 space-y-0.5">
              <p><span className="text-slate-300">serverType:</span> vm | bare_metal | container_host</p>
              <p><span className="text-slate-300">provider:</span> on_premise | aws | azure | gcp | oracle_cloud | own_datacenter</p>
              <p><span className="text-slate-300">environment:</span> production | staging | development | sandbox</p>
            </div>
            <p className="mt-2 font-semibold text-slate-300">Colunas opcionais:</p>
            <p className="font-mono text-slate-500">displayName, description, ipAddress, domain, fqdn, osName, osVersion, cpuCores, ramGb, ownerTeam</p>
          </div>

          {/* Actions */}
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
              <Button variant="secondary" size="sm" onClick={handleClose}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!csvText.trim()} onClick={handlePreview}>
                Analisar arquivo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          {parsedRows.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma linha encontrada. Verifique se o arquivo possui cabeçalho e ao menos uma linha de dados.</p>
          ) : (
            <>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">{validCount} valido(s)</span>
                {errorCount > 0 && <span className="text-red-400">{errorCount} com erro(s)</span>}
              </div>

              <div className="max-h-72 overflow-y-auto rounded border border-line">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="border-b border-line">
                      <th className="px-3 py-2 text-left font-medium text-slate-400">#</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">Hostname</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">Provedor</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">Ambiente</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr key={row.lineNumber} className="border-b border-line/50 last:border-0">
                        <td className="px-3 py-1.5 text-slate-500">{row.lineNumber}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-200">{row.hostname || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-300">{row.serverType || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-300">{row.provider || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-300">{row.environment || '—'}</td>
                        <td className="px-3 py-1.5">
                          {row.errors.length === 0 ? (
                            <span className="text-green-400">✓ Valido</span>
                          ) : (
                            <span
                              className="cursor-help text-red-400"
                              title={row.errors.join('\n')}
                            >
                              ✗ {row.errors[0]}
                              {row.errors.length > 1 && ` (+${row.errors.length - 1})`}
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
            <Button variant="secondary" size="sm" onClick={() => setStep('input')}>
              Voltar
            </Button>
            <Button size="sm" disabled={validCount === 0} onClick={() => void handleImport()}>
              Importar {validCount} servidor(es)
            </Button>
          </div>
        </div>
      )}

      {/* ── Step: importing ── */}
      {step === 'importing' && (
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-300">
            Importando {importedCount} de {totalToImport}...
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
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
            <span className="text-green-400">
              {successCount} importado(s) com sucesso
            </span>
            {failCount > 0 && (
              <span className="text-red-400">{failCount} com erro(s)</span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto rounded border border-line">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left font-medium text-slate-400">#</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">Hostname</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.lineNumber} className="border-b border-line/50 last:border-0">
                    <td className="px-3 py-1.5 text-slate-500">{r.lineNumber}</td>
                    <td className="px-3 py-1.5 font-mono text-slate-200">{r.hostname || '—'}</td>
                    <td className="px-3 py-1.5">
                      {r.status === 'success' ? (
                        <span className="text-green-400">✓ Importado</span>
                      ) : r.status === 'skipped' ? (
                        <span className="text-slate-500">— Ignorado</span>
                      ) : (
                        <span className="cursor-help text-red-400" title={r.error}>
                          ✗ {r.error ?? 'Erro'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
