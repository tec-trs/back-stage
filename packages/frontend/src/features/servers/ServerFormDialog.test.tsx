import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../../shared/api/http-client';

import { ServerFormDialog } from './ServerFormDialog';

vi.mock('../../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderDialog(props: Partial<Parameters<typeof ServerFormDialog>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  return {
    onClose,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ServerFormDialog isOpen onClose={onClose} server={null} {...props} />
      </QueryClientProvider>,
    ),
  };
}

describe('ServerFormDialog', () => {
  afterEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('exibe o titulo "Incluir Servidor" no modo criacao', () => {
    renderDialog();
    expect(screen.getByText('Incluir Servidor')).toBeInTheDocument();
  });

  it('bloqueia o hostname no modo edicao', () => {
    renderDialog({
      server: {
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
      },
    });

    expect(screen.getByText('Editar Servidor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('web-01.prod')).toBeDisabled();
  });

  it('valida o formato do hostname antes de enviar', () => {
    renderDialog();

    fireEvent.change(screen.getByPlaceholderText('web-01.prod'), {
      target: { value: 'Hostname Invalido' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar servidor' }));

    expect(
      screen.getByText('O hostname deve conter apenas letras minusculas, numeros, ponto e hifen'),
    ).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('cria um servidor com disco adicionado dinamicamente', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: 'srv-1',
      hostname: 'web-01.prod',
      disks: [],
    });

    const { onClose } = renderDialog();

    fireEvent.change(screen.getByPlaceholderText('web-01.prod'), {
      target: { value: 'web-01.prod' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ Disco' }));
    fireEvent.change(screen.getByPlaceholderText('/data'), { target: { value: '/data' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar servidor' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/servers',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          hostname: 'web-01.prod',
          disks: [expect.objectContaining({ mountPoint: '/data' })],
        }),
      }),
    );
  });
});
