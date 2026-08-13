export type PolicyOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan';

export interface PolicyRule {
  field: string;
  operator: PolicyOperator;
  value: string | number;
}

export type PolicyCombinator = 'AND' | 'OR';

export interface PolicyDefinition {
  rules: PolicyRule[];
  combinator: PolicyCombinator;
}

const VALID_OPERATORS: PolicyOperator[] = ['equals', 'contains', 'greaterThan', 'lessThan'];

export function parsePolicyDefinition(raw: string): PolicyDefinition {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Definicao de policy invalida: JSON malformado');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Definicao de policy invalida: esperado um objeto');
  }

  const candidate = parsed as Partial<PolicyDefinition>;

  if (!Array.isArray(candidate.rules)) {
    throw new Error('Definicao de policy invalida: "rules" deve ser um array');
  }

  for (const rule of candidate.rules) {
    if (
      typeof rule !== 'object' ||
      rule === null ||
      typeof rule.field !== 'string' ||
      !VALID_OPERATORS.includes(rule.operator as PolicyOperator) ||
      (typeof rule.value !== 'string' && typeof rule.value !== 'number')
    ) {
      throw new Error('Definicao de policy invalida: regra malformada');
    }
  }

  if (candidate.combinator !== 'AND' && candidate.combinator !== 'OR') {
    throw new Error('Definicao de policy invalida: "combinator" deve ser AND ou OR');
  }

  return { rules: candidate.rules as PolicyRule[], combinator: candidate.combinator };
}
