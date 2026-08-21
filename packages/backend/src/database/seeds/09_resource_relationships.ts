import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const org = await knex('organizations').where({ slug: 'default' }).first();
  if (!org) {
    throw new Error('Organização padrão não encontrada');
  }

  // Limpar relacionamentos existentes para este seed
  await knex('resource_relationships')
    .whereRaw("metadata->>'seed' = ?", ['infrastructure_services'])
    .del();

  // Buscar ou criar aplicações para os serviços
  const getOrCreateApp = async (
    name: string,
    code: string,
    serverName?: string,
  ): Promise<string> => {
    let app = await knex('applications').where({ code, organization_id: org.id }).first();
    if (app) return app.id;

    const result = await knex('applications')
      .insert({
        code,
        display_name: name,
        description: `Aplicação ${name}`,
        app_type: 'middleware',
        organization_id: org.id,
      })
      .returning('id');
    return result[0].id;
  };

  // Buscar ou criar servidor
  const getOrCreateServer = async (hostname: string): Promise<string> => {
    let server = await knex('servers').where({ hostname, organization_id: org.id }).first();
    if (server) return server.id;

    const result = await knex('servers')
      .insert({
        hostname,
        server_type: 'physical',
        provider: 'on_premise',
        status: 'active',
        environment: 'production',
        organization_id: org.id,
      })
      .returning('id');
    return result[0].id;
  };

  // Buscar ou criar servidores
  const server01 = await getOrCreateServer('ocsl-totgps-01p');
  const server02 = await getOrCreateServer('ocsl-totgps-02p');
  const server03 = await getOrCreateServer('ocsl-totgps-03p');
  const server04 = await getOrCreateServer('ocsl-totgps-04p');
  const serverTotys = await getOrCreateServer('ocsl-totdfs-01p');
  const serverSholder = await getOrCreateServer('ocsl-totshe-01p');

  // Criar aplicações para os serviços
  const pasoe01 = await getOrCreateApp('PASOE-TOTYS-01P', 'pasoe-totys-01p', 'ocsl-totgps-01p');
  const pasoe02 = await getOrCreateApp('PASOE-TOTYS-02P', 'pasoe-totys-02p', 'ocsl-totgps-02p');
  const pasoe03 = await getOrCreateApp('PASOE-TOTYS-03P', 'pasoe-totys-03p', 'ocsl-totgps-03p');
  const pasoe04 = await getOrCreateApp('PASOE-TOTYS-04P', 'pasoe-totys-04p', 'ocsl-totgps-04p');
  const totysRef = await getOrCreateApp('TOTYS-DFS', 'totys-dfs', 'ocsl-totdfs-01p');
  const sholderTotys = await getOrCreateApp('SHOLDER-TOTYS', 'sholder-totys', 'ocsl-totshe-01p');

  // Criar relacionamentos com impactos de cascata
  const relationships = [
    // Relacionamentos de hospedagem (server hosts application)
    { source_type: 'server', source_id: server01, target_type: 'application', target_id: pasoe01, relation_type: 'hosts' },
    { source_type: 'server', source_id: server02, target_type: 'application', target_id: pasoe02, relation_type: 'hosts' },
    { source_type: 'server', source_id: server03, target_type: 'application', target_id: pasoe03, relation_type: 'hosts' },
    { source_type: 'server', source_id: server04, target_type: 'application', target_id: pasoe04, relation_type: 'hosts' },
    { source_type: 'server', source_id: serverTotys, target_type: 'application', target_id: totysRef, relation_type: 'hosts' },
    { source_type: 'server', source_id: serverSholder, target_type: 'application', target_id: sholderTotys, relation_type: 'hosts' },

    // Relacionamentos de dependência (app depends on app)
    { source_type: 'application', source_id: pasoe01, target_type: 'application', target_id: totysRef, relation_type: 'depends_on' },
    { source_type: 'application', source_id: pasoe01, target_type: 'application', target_id: sholderTotys, relation_type: 'depends_on' },
    { source_type: 'application', source_id: pasoe02, target_type: 'application', target_id: totysRef, relation_type: 'depends_on' },
    { source_type: 'application', source_id: pasoe02, target_type: 'application', target_id: sholderTotys, relation_type: 'depends_on' },
    { source_type: 'application', source_id: pasoe03, target_type: 'application', target_id: totysRef, relation_type: 'depends_on' },
    { source_type: 'application', source_id: pasoe03, target_type: 'application', target_id: sholderTotys, relation_type: 'depends_on' },
    { source_type: 'application', source_id: pasoe04, target_type: 'application', target_id: totysRef, relation_type: 'depends_on' },
    { source_type: 'application', source_id: pasoe04, target_type: 'application', target_id: sholderTotys, relation_type: 'depends_on' },
  ];

  // Inserir relacionamentos
  await knex('resource_relationships').insert(
    relationships.map((rel) => ({
      ...rel,
      organization_id: org.id,
      metadata: { seed: 'infrastructure_services' },
    })),
  );

  const hostCount = relationships.filter((r) => r.relation_type === 'hosts').length;
  const depCount = relationships.filter((r) => r.relation_type === 'depends_on').length;
  console.log(
    `✓ ${relationships.length} relacionamentos criados no resource-graph (${hostCount} hosts + ${depCount} dependências)`,
  );
}
