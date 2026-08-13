import { describe, expect, it } from 'vitest';

import { err, isErr, isOk, ok } from './result.js';

describe('Result', () => {
  it('cria um resultado de sucesso', () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (isOk(result)) {
      expect(result.value).toBe(42);
    }
  });

  it('cria um resultado de falha', () => {
    const result = err(new Error('falhou'));
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
  });
});
