import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from './auth.store';
import { ProtectedRoute } from './ProtectedRoute';

function renderWithRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<p>Login Page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<p>Conteudo protegido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null });
  });

  it('redireciona para /login quando nao ha accessToken', () => {
    useAuthStore.setState({ accessToken: null, user: null });
    renderWithRoute('/');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renderiza o conteudo protegido quando ha accessToken', () => {
    useAuthStore.setState({
      accessToken: 'valid-token',
      user: { id: '1', code: 'a', email: 'a@a.com', fullName: 'A', roles: ['admin'] },
    });
    renderWithRoute('/');
    expect(screen.getByText('Conteudo protegido')).toBeInTheDocument();
  });
});
