import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Erro nao tratado capturado pelo ErrorBoundary', error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-slate-100">
          <h1 className="text-2xl font-semibold">Algo deu errado</h1>
          <p className="max-w-md text-slate-400">{this.state.error.message}</p>
          <Button variant="secondary" onClick={() => this.setState({ error: null })}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
