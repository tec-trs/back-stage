import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const component = await knex('catalog_entities').where({ name: 'backend-api' }).first();
  const resource = await knex('catalog_entities').where({ name: 'postgres-primary' }).first();

  if (!component || !resource) {
    throw new Error('Seed de catalog_entity_relations depende do seed de catalog_entities');
  }

  await knex('catalog_entity_relations')
    .where({ source_entity_id: component.id, target_entity_id: resource.id })
    .del();

  await knex('catalog_entity_relations').insert({
    source_entity_id: component.id,
    target_entity_id: resource.id,
    relation_type: 'dependsOn',
  });
}
