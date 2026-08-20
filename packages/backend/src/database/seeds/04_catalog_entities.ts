import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const org = await knex('organizations').where({ slug: 'default' }).first();
  const team = await knex('teams').where({ slug: 'platform-engineering' }).first();

  if (!org || !team) {
    throw new Error('Seed de catalog_entities depende dos seeds de organizations e teams');
  }

  await knex('catalog_entities')
    .whereIn('name', ['platform-engineering-center', 'backend-api', 'postgres-primary'])
    .del();

  const [system] = await knex('catalog_entities')
    .insert({
      kind: 'system',
      type: 'platform',
      name: 'platform-engineering-center',
      title: 'Platform Engineering Center',
      description: 'Sistema principal da plataforma corporativa',
      lifecycle: 'production',
      owner_team_id: team.id,
      organization_id: org.id,
    })
    .returning('id');

  await knex('catalog_entities')
    .insert({
      kind: 'component',
      type: 'service',
      name: 'backend-api',
      title: 'Backend API',
      description: 'API principal do Platform Engineering Center',
      lifecycle: 'production',
      owner_team_id: team.id,
      system_id: system.id,
      repository_url: 'https://github.com/back-stage/back-stage',
      organization_id: org.id,
    })
    .returning('id');

  await knex('catalog_entities').insert({
    kind: 'resource',
    type: 'database',
    name: 'postgres-primary',
    title: 'PostgreSQL Primario',
    description: 'Instancia PostgreSQL 16 principal da plataforma',
    lifecycle: 'production',
    owner_team_id: team.id,
    system_id: system.id,
    organization_id: org.id,
  });
}
