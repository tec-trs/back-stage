import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Para cada organização, criar groups baseado no display_group dos servidores
  const orgs = await knex('organizations').select('id');

  for (const org of orgs) {
    // Pegar todos os display_groups únicos dessa organização
    const uniqueGroups = await knex('servers')
      .where('organization_id', org.id)
      .whereNull('deleted_at')
      .whereNotNull('display_group')
      .distinct('display_group')
      .pluck('display_group');

    for (const groupName of uniqueGroups) {
      // Criar o server_group se não existir
      const existing = await knex('server_groups')
        .where({ organization_id: org.id, name: groupName })
        .whereNull('deleted_at')
        .first();

      let groupId = existing?.id;

      if (!groupId) {
        const [newGroup] = await knex('server_groups')
          .insert({
            organization_id: org.id,
            name: groupName,
            status: 'active',
          })
          .returning('id');
        groupId = newGroup.id;
      }

      // Adicionar todos os servidores desse display_group como membros
      const servers = await knex('servers')
        .where({
          organization_id: org.id,
          display_group: groupName,
        })
        .whereNull('deleted_at')
        .select('id');

      for (const [index, server] of servers.entries()) {
        const exists = await knex('server_group_members')
          .where({
            group_id: groupId,
            server_id: server.id,
          })
          .whereNull('deleted_at')
          .first();

        if (!exists) {
          await knex('server_group_members').insert({
            group_id: groupId,
            server_id: server.id,
            organization_id: org.id,
            order: index,
          });
        }
      }
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remover todos os server_groups e seus membros
  await knex('server_group_members').del();
  await knex('server_groups').del();
}
