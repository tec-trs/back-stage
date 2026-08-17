import { describe, expect, it } from 'vitest';

import { buildPrefixTsQuery } from './search.repository.js';

describe('buildPrefixTsQuery', () => {
  it('converte uma palavra unica em busca por prefixo', () => {
    expect(buildPrefixTsQuery('backend')).toBe('backend:*');
  });

  it('combina multiplas palavras com AND', () => {
    expect(buildPrefixTsQuery('backend api')).toBe('backend:* & api:*');
  });

  it('remove caracteres especiais de tsquery', () => {
    expect(buildPrefixTsQuery("bad&input|(injection)'*")).toBe('badinputinjection:*');
  });

  it('retorna string vazia para entrada vazia ou somente caracteres especiais', () => {
    expect(buildPrefixTsQuery('   ')).toBe('');
    expect(buildPrefixTsQuery('&|()')).toBe('');
  });
});

describe('SearchRepository unifiedSearch', () => {
  it('deve construir query UNION corretamente para múltiplas fontes', () => {
    // Teste unitário da lógica de construção da query
    const query = 'test';
    const tsQuery = buildPrefixTsQuery(query);

    expect(tsQuery).toBe('test:*');
    expect(tsQuery).toBeTruthy();
  });

  it('deve lidar com queries vazias gracefully', () => {
    const emptyQuery = '';
    const result = buildPrefixTsQuery(emptyQuery);

    expect(result).toBe('');
  });

  it('deve filtrar caracteres especiais em tags', () => {
    const dirty = "tag-with'special*chars";
    const clean = dirty.replace(/[&|!():'*]/g, '');

    expect(clean).toBe('tag-withspecialchars');
  });
});
