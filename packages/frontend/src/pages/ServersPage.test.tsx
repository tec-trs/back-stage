import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../shared/api/http-client';

import { ServersPage } from './ServersPage';

vi.mock('../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderServersPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ServersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const SERVER_ITEM = {
  id: 'srv-1',
  hostname: 'web-01.prod',
  displayName: 'Web 01',
  description: null,
  serverType: 'vm',
  provider: 'aws',
  cpuCores: 4,
  cpuModel: null,
  ramGb: 16,
  hypervisor: null,
  osName: 'Ubuntu',
  osVersion: '22.04',
  osArchitecture: 'x86_64',
  osEolDate: null,
  privateIps: ['10.0.0.5'],
  publicIp: null,
  vlanSubnet: null,
  gateway: null,
  dnsServers: [],
  accessMethod: 'ssh',
  securityGroup: null,
  dataClassification: null,
  status: 'active',
  environment: 'production',
  ownerTeam: null,
  ownerUserId: null,
  costCenter: null,
  hasBackup: false,
  backupPolicy: null,
  lastBackupAt: null,
  monthlyCostEstimate: null,
  monitoringUrl: null,
  metadata: {},
  disks: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ServersPage', () => {
  afterEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('exibe um estado vazio quando nao ha servidores', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, pageSize: 50, total: 0 },
    });

    renderServersPage();

    expect(await screen.findByText('Nenhum servidor encontrado')).toBeInTheDocument();
  });

  it('lista servidores e mantem as acoes desabilitadas sem selecao', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [SERVER_ITEM],
      pagination: { page: 1, pageSize: 50, total: 1 },
    });

    renderServersPage();

    expect(await screen.findByText('Web 01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
  });

  it('habilita as acoes ao selecionar um servidor', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [SERVER_ITEM],
      pagination: { page: 1, pageSize: 50, total: 1 },
    });

    renderServersPage();

    fireEvent.click(await screen.findByRole('radio', { name: 'Selecionar web-01.prod' }));

    expect(screen.getByRole('button', { name: 'Editar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeEnabled();
  });

  it('abre o dialogo de criacao ao clicar em "Incluir Servidor"', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, pageSize: 50, total: 0 },
    });

    renderServersPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Incluir Servidor' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Incluir Servidor' })).toBeInTheDocument();
    });
  });
});
