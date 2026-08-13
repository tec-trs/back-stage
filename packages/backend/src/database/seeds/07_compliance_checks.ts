import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('compliance_checks').where({ slug: 'owasp-top10-authentication' }).del();

  await knex('compliance_checks').insert({
    name: 'Autenticacao segue OWASP Top 10',
    slug: 'owasp-top10-authentication',
    framework: 'OWASP',
    description: 'Verifica se o servico implementa controles de autenticacao do OWASP Top 10',
    severity: 'high',
  });
}
