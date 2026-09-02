import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/http-client';
import { SearchIcon, XIcon } from './icons';

interface SearchResult {
  id: string;
  resourceType: string;
  label: string;
  description: string | null;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchResults();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ items: SearchResult[] }>('/api/unified-search', {
        query: { q: query, pageSize: 10 },
      });
      setResults(data.items || []);
    } catch (err) {
      console.error('Erro ao buscar:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

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
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleViewAll = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      handleViewAll();
    }
  };

  return (
    <div className="relative flex-1 max-w-sm">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          data-testid="global-search-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Buscar servidores, apps, bases..."
          className="w-full pl-10 pr-8 py-2 bg-surface-raised text-slate-100 rounded border border-line placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-signal focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-raised rounded border border-line shadow-lg z-50">
          {isLoading ? (
            <div className="p-4 text-center text-slate-400 text-sm">Buscando...</div>
          ) : results.length > 0 ? (
            <>
              <div className="max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <button
                    key={`${result.resourceType}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-line last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-100 font-medium truncate">{result.label}</p>
                        <p className="text-xs text-slate-400 capitalize">{result.resourceType}</p>
                      </div>
                      {result.description && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleViewAll}
                className="w-full px-4 py-2 text-sm text-center text-signal hover:bg-slate-700 border-t border-line"
              >
                Ver todos os resultados
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
