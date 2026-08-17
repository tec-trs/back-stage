import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Spinner } from '../shared/components/Spinner';

interface SearchResult {
  id: string;
  resourceType: string;
  label: string;
  description: string | null;
  environment?: string;
  status?: string;
}

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  server: 'bg-blue-100 text-blue-900',
  application: 'bg-purple-100 text-purple-900',
  database: 'bg-pink-100 text-pink-900',
  url: 'bg-amber-100 text-amber-900',
  catalog_entity: 'bg-gray-100 text-gray-900',
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  server: 'Servidor',
  application: 'Aplicação',
  database: 'Banco de Dados',
  url: 'URL',
  catalog_entity: 'Entidade de Catálogo',
};

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const selectedTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let url = `/api/search/unified-search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`;
        if (selectedTags.length > 0) {
          url += `&tags=${selectedTags.join(',')}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar');
        const data = await response.json();
        setResults(data.items || []);
        setTotal(data.pagination?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, selectedTags, page]);

  const handleResultClick = (result: SearchResult) => {
    const pathMap: Record<string, string> = {
      server: 'servers',
      application: 'applications',
      database: 'databases',
      url: 'urls',
      catalog_entity: 'catalog',
    };
    const path = pathMap[result.resourceType] || result.resourceType + 's';
    navigate(`/${path}/${result.id}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (!query) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-100 mb-4">Buscar</h1>
        <p className="text-slate-400">Digite um termo de busca para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100 mb-2">Resultados da Busca</h1>
        <p className="text-slate-400">
          "{query}" {total > 0 ? `(${total} resultado${total !== 1 ? 's' : ''})` : ''}
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {isLoading ? (
        <Spinner />
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-slate-800 p-8 text-center text-slate-400">
          Nenhum resultado encontrado
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {results.map((result) => (
              <button
                key={`${result.resourceType}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-4 rounded-lg border border-slate-800 hover:border-slate-600 hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-100 font-medium truncate">{result.label}</h3>
                    {result.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mt-1">{result.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge tone="default" className="capitalize">
                        {RESOURCE_TYPE_LABELS[result.resourceType] || result.resourceType}
                      </Badge>
                      {result.environment && (
                        <Badge tone="warning" className="text-xs">
                          {result.environment}
                        </Badge>
                      )}
                      {result.status && (
                        <Badge tone="default" className="text-xs">
                          {result.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-slate-400">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
