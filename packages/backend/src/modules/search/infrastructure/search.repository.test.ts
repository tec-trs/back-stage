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
