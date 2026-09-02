import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { PlusIcon } from '../shared/components/icons';
import { Spinner } from '../shared/components/Spinner';
import { RelationshipRegistrationDialog } from '../features/relationship-registrations/RelationshipRegistrationDialog';
import { useRelationshipRegistrations } from '../features/relationship-registrations/use-relationship-registrations';

export function RelationshipRegistrationsPage() {
  const { data, isLoading, isError, error } = useRelationshipRegistrations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Cadastros de Relacionamentos"
        description="Coleções nomeadas de relacionamentos reais do inventário para documentar dependências e fluxos específicos"
        actions={
          <Button icon={<PlusIcon />} onClick={() => setIsCreateOpen(true)}>
            Novo Cadastro
          </Button>
        }
      />

      <RelationshipRegistrationDialog
        isOpen={isCreateOpen}
        onClose={(createdId) => {
          setIsCreateOpen(false);
          if (createdId) navigate(`/relationship-registrations/${createdId}`);
        }}
      />

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar cadastros'}
        />
      )}
      {data && data.length === 0 && (
        <EmptyState
          title="Nenhum cadastro registrado"
          description='Crie um cadastro e comece a adicionar relacionamentos com "Novo Cadastro".'
        />
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Relacionamentos</th>
                <th className="px-4 py-2 font-medium">Atualizado em</th>
              </tr>
            </thead>
            <tbody>
              {data.map((registration) => (
                <tr key={registration.id} className="border-t border-line hover:bg-surface/50">
                  <td className="px-4 py-2">
                    <Link
                      to={`/relationship-registrations/${registration.id}`}
                      className="font-medium text-slate-100 hover:underline"
                    >
                      {registration.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{registration.description || '—'}</td>
                  <td className="px-4 py-2 font-mono text-slate-300">{registration.relationshipCount}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(registration.updatedAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
