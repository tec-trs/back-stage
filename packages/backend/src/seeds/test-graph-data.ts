import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const orgId = '3ebf45d7-7e5d-4297-9116-f8d679ec0208';

  const existing = await knex('resource_relationships')
    .where({
      organization_id: orgId,
      target_id: 'c4aab143-c123-44bc-884c-af9620e069e8',
      target_type: 'url',
      relation_type: 'exposes',
    })
    .first();

  if (!existing) {
    const apps = await knex('applications')
      .where({ organization_id: orgId })
      .limit(1);

    if (apps.length > 0) {
      await knex('resource_relationships').insert({
        id: knex.raw('gen_random_uuid()'),
        organization_id: orgId,
        source_type: 'application',
        source_id: apps[0].id,
        target_type: 'url',
        target_id: 'c4aab143-c123-44bc-884c-af9620e069e8',
        relation_type: 'exposes',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }
}
