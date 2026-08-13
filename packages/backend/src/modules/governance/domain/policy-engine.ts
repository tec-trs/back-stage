import type { PolicyDefinition, PolicyRule } from './policy-definition.js';

export type PolicyEvaluationStatus = 'pass' | 'fail' | 'warning';

export interface RuleEvaluationDetail {
  field: string;
  operator: string;
  expected: string | number;
  actual: unknown;
  passed: boolean;
}

export interface PolicyEvaluationResult {
  status: PolicyEvaluationStatus;
  details: RuleEvaluationDetail[];
}

function getFieldValue(entity: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, entity);
}

function evaluateRule(entity: Record<string, unknown>, rule: PolicyRule): RuleEvaluationDetail {
  const actual = getFieldValue(entity, rule.field);
  let passed = false;

  switch (rule.operator) {
    case 'equals':
      passed = String(actual ?? '') === String(rule.value);
      break;
    case 'contains':
      passed = Array.isArray(actual)
        ? actual.map(String).includes(String(rule.value))
        : String(actual ?? '').includes(String(rule.value));
      break;
    case 'greaterThan':
      passed = Number(actual) > Number(rule.value);
      break;
    case 'lessThan':
      passed = Number(actual) < Number(rule.value);
      break;
    default:
      passed = false;
  }

  return { field: rule.field, operator: rule.operator, expected: rule.value, actual, passed };
}

export class PolicyEngine {
  public evaluate(
    entity: Record<string, unknown>,
    definition: PolicyDefinition,
  ): PolicyEvaluationResult {
    if (definition.rules.length === 0) {
      return { status: 'pass', details: [] };
    }

    const details = definition.rules.map((rule) => evaluateRule(entity, rule));

    const passed =
      definition.combinator === 'OR'
        ? details.some((detail) => detail.passed)
        : details.every((detail) => detail.passed);

    return { status: passed ? 'pass' : 'fail', details };
  }
}
