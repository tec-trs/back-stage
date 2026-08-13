import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '../features/auth/auth.store';

import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null });
  });

  it('exibe as informacoes do usuario autenticado', () => {
    useAuthStore.setState({
      accessToken: 'token',
      user: {
        id: '1',
        email: 'admin@back-stage.dev',
        fullName: 'Admin',
        roles: ['admin', 'maintainer'],
      },
    });

    render(<SettingsPage />);

    expect(screen.getByText('admin@back-stage.dev')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Mantenedor')).toBeInTheDocument();
  });
});
