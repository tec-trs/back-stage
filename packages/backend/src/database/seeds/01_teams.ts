import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const org = await knex('organizations').where({ slug: 'default' }).first();
  if (!org) {
    throw new Error('Organização padrão não encontrada. Execute as migrations primeiro.');
  }

  await knex('teams').where({ slug: 'platform-engineering' }).del();

  await knex('teams').insert({
    name: 'Platform Engineering',
    slug: 'platform-engineering',
    description: 'Time responsavel pela Plataforma de Engenharia Interna',
    organization_id: org.id,
  });
}
