import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('teams').where({ slug: 'platform-engineering' }).del();

  await knex('teams').insert({
    name: 'Platform Engineering',
    slug: 'platform-engineering',
    description: 'Time responsavel pela Plataforma de Engenharia Interna',
  });
}
