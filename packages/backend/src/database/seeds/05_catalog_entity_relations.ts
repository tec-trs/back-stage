import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const org = await knex('organizations').where({ slug: 'default' }).first();
  const component = await knex('catalog_entities').where({ name: 'backend-api' }).first();
  const resource = await knex('catalog_entities').where({ name: 'postgres-primary' }).first();

  if (!org || !component || !resource) {
    throw new Error('Seed de catalog_entity_relations depende dos seeds de organizations e catalog_entities');
  }

  await knex('catalog_entity_relations')
    .where({ source_entity_id: component.id, target_entity_id: resource.id })
    .del();

  await knex('catalog_entity_relations').insert({
    source_entity_id: component.id,
    target_entity_id: resource.id,
    relation_type: 'dependsOn',
    organization_id: org.id,
  });
}
