import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  it('renderiza o conteudo filho', () => {
    render(<Badge>production</Badge>);
    expect(screen.getByText('production')).toBeInTheDocument();
  });

  it('aplica a classe de tone correta', () => {
    render(<Badge tone="danger">fail</Badge>);
    expect(screen.getByText('fail')).toHaveClass('text-red-300');
  });

  it('usa o tone default quando nenhum e informado', () => {
    render(<Badge>default</Badge>);
    expect(screen.getByText('default')).toHaveClass('text-slate-300');
  });
});
