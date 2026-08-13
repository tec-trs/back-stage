import { describe, expect, it } from 'vitest';

import { parsePolicyDefinition } from './policy-definition.js';
import { PolicyEngine } from './policy-engine.js';

describe('PolicyEngine', () => {
  const engine = new PolicyEngine();

  it('avalia equals corretamente', () => {
    const definition = parsePolicyDefinition(
      JSON.stringify({
        rules: [{ field: 'lifecycle', operator: 'equals', value: 'production' }],
        combinator: 'AND',
      }),
    );

    const result = engine.evaluate({ lifecycle: 'production' }, definition);

    expect(result.status).toBe('pass');
  });

  it('avalia contains em string e em array', () => {
    const definition = parsePolicyDefinition(
      JSON.stringify({
        rules: [{ field: 'tags', operator: 'contains', value: 'critical' }],
        combinator: 'AND',
      }),
    );

    expect(engine.evaluate({ tags: ['critical', 'payments'] }, definition).status).toBe('pass');
    expect(engine.evaluate({ tags: ['internal'] }, definition).status).toBe('fail');
  });

  it('avalia greaterThan e lessThan numericamente', () => {
    const definition = parsePolicyDefinition(
      JSON.stringify({
        rules: [
          { field: 'uptimeSeconds', operator: 'greaterThan', value: 100 },
          { field: 'errorRate', operator: 'lessThan', value: 0.05 },
        ],
        combinator: 'AND',
      }),
    );

    expect(engine.evaluate({ uptimeSeconds: 200, errorRate: 0.01 }, definition).status).toBe(
      'pass',
    );
    expect(engine.evaluate({ uptimeSeconds: 50, errorRate: 0.01 }, definition).status).toBe('fail');
  });

  it('combina regras com OR', () => {
    const definition = parsePolicyDefinition(
      JSON.stringify({
        rules: [
          { field: 'lifecycle', operator: 'equals', value: 'production' },
          { field: 'lifecycle', operator: 'equals', value: 'experimental' },
        ],
        combinator: 'OR',
      }),
    );

    expect(engine.evaluate({ lifecycle: 'experimental' }, definition).status).toBe('pass');
    expect(engine.evaluate({ lifecycle: 'deprecated' }, definition).status).toBe('fail');
  });

  it('retorna pass quando a policy nao possui regras', () => {
    const definition = parsePolicyDefinition(JSON.stringify({ rules: [], combinator: 'AND' }));
    expect(engine.evaluate({}, definition).status).toBe('pass');
  });

  it('lanca erro para definicao invalida', () => {
    expect(() => parsePolicyDefinition('not-json')).toThrow('JSON malformado');
    expect(() => parsePolicyDefinition(JSON.stringify({ rules: 'x', combinator: 'AND' }))).toThrow(
      'deve ser um array',
    );
    expect(() =>
      parsePolicyDefinition(
        JSON.stringify({ rules: [{ field: 'a', operator: 'bad', value: 1 }], combinator: 'AND' }),
      ),
    ).toThrow('regra malformada');
  });
});
