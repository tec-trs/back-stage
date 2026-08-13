import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('Falha proposital');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza os filhos normalmente quando nao ha erro', () => {
    render(
      <ErrorBoundary>
        <p>conteudo normal</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('conteudo normal')).toBeInTheDocument();
  });

  it('captura o erro e exibe a UI de fallback', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Falha proposital')).toBeInTheDocument();
  });

  it('exibe o botao de tentar novamente apos o erro', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    // Boom sempre lanca novamente ao remontar; a UI de fallback deve reaparecer.
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
  });
});
