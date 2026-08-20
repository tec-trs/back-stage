import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const org = await knex('organizations').where({ slug: 'default' }).first();
  if (!org) {
    throw new Error('Organização padrão não encontrada. Execute as migrations primeiro.');
  }

  await knex('governance_policies').where({ slug: 'production-requires-owner' }).del();

  await knex('governance_policies').insert({
    name: 'Producao exige time responsavel',
    slug: 'production-requires-owner',
    description: 'Toda entidade com lifecycle production deve ter um owner_team_id definido',
    policy_type: 'quality',
    definition: JSON.stringify({
      rule: 'owner_team_id_required_when_production',
      appliesTo: ['component', 'resource'],
    }),
    is_active: true,
    organization_id: org.id,
  });
}
