import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const org = await knex('organizations').where({ slug: 'default' }).first();
  if (!org) {
    throw new Error('Organização padrão não encontrada. Execute as migrations primeiro.');
  }

  let team = await knex('teams').where({ slug: 'platform-engineering' }).first();
  if (!team) {
    const [newTeam] = await knex('teams')
      .insert({
        name: 'Platform Engineering',
        slug: 'platform-engineering',
        description: 'Time responsavel pela Plataforma de Engenharia Interna',
        organization_id: org.id,
      })
      .returning('*');
    team = newTeam;
  }

  // Delete existing entries to allow re-seeding (only infra ones)
  const infraNames = [
    'ocsl-totgps-01p', 'ocsl-totgps-02p', 'ocsl-totgps-03p', 'ocsl-totgps-04p',
    'ocsl-totshe-01p', 'ocsl-totdfs-01p', 'ocsl-totilic-01p', 'ocsl-totilic-02p',
    'pasoe-totys-01p', 'pasoe-totys-02p', 'pasoe-totys-03p', 'pasoe-totys-04p',
    'tomcat-totys-01p', 'tomcat-totys-02p', 'tomcat-totys-03p', 'tomcat-totys-04p',
    'sholder-hcm-01p', 'sholder-totys-01p', 'totys-dfs-01p', 'hcm-dfs-01p',
    'license-server-01p', 'license-server-02p',
  ];

  const infraIds = await knex('catalog_entities')
    .whereIn('name', infraNames)
    .pluck('id');

  if (infraIds.length > 0) {
    await knex('catalog_entity_relations')
      .whereIn('source_entity_id', infraIds)
      .orWhereIn('target_entity_id', infraIds)
      .del();
    await knex('catalog_entities').whereIn('id', infraIds).del();
  }

  // Create Server entities
  await knex('catalog_entities')
    .insert([
      {
        kind: 'resource',
        type: 'server',
        name: 'ocsl-totgps-01p',
        title: 'OCSL-TOTGPS-01P',
        description: 'Servidor de produção TOTGPS 01',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
      },
      {
        kind: 'resource',
        type: 'server',
        name: 'ocsl-totgps-02p',
        title: 'OCSL-TOTGPS-02P',
        description: 'Servidor de produção TOTGPS 02',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
      },
      {
        kind: 'resource',
        type: 'server',
        name: 'ocsl-totgps-03p',
        title: 'OCSL-TOTGPS-03P',
        description: 'Servidor de produção TOTGPS 03',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
      },
      {
        kind: 'resource',
        type: 'server',
        name: 'ocsl-totgps-04p',
        title: 'OCSL-TOTGPS-04P',
        description: 'Servidor de produção TOTGPS 04',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
      },
      {
        kind: 'resource',
        type: 'server',
        name: 'ocsl-totshe-01p',
        title: 'OCSL-TOTSHE-01P',
        description: 'Servidor de produção TOTSHE 01',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
      },
      {
        kind: 'resource',
        type: 'server',
        name: 'ocsl-totdfs-01p',
        title: 'OCSL-TOTDFS-01P',
        description: 'Servidor de produção TOTDFS 01',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
      },
      {
        kind: 'resource',
        type: 'server',
        name: 'ocsl-totilic-01p',
        title: 'OCSL-TOTILIC-01P',
        description: 'Servidor de produção TOTILIC 01',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
      },
      {
        kind: 'resource',
        type: 'server',
        name: 'ocsl-totilic-02p',
        title: 'OCSL-TOTILIC-02P',
        description: 'Servidor de produção TOTILIC 02',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
      },
    ])
    .returning('*');

  // Create Service entities
  const services = await knex('catalog_entities')
    .insert([
      // TOTGPS-01P services
      {
        kind: 'component',
        type: 'service',
        name: 'pasoe-totys-01p',
        title: 'PASOE-TOTYS (OCSL-TOTGPS-01P)',
        description: 'Progress Application Server for OpenEdge - TOTYS',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totgps-01p' },
      },
      {
        kind: 'component',
        type: 'service',
        name: 'tomcat-totys-01p',
        title: 'TOMCAT-TOTYS (OCSL-TOTGPS-01P)',
        description: 'Apache Tomcat - TOTYS',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totgps-01p' },
      },
      // TOTGPS-02P services
      {
        kind: 'component',
        type: 'service',
        name: 'pasoe-totys-02p',
        title: 'PASOE-TOTYS (OCSL-TOTGPS-02P)',
        description: 'Progress Application Server for OpenEdge - TOTYS',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totgps-02p' },
      },
      {
        kind: 'component',
        type: 'service',
        name: 'tomcat-totys-02p',
        title: 'TOMCAT-TOTYS (OCSL-TOTGPS-02P)',
        description: 'Apache Tomcat - TOTYS',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totgps-02p' },
      },
      // TOTGPS-03P services
      {
        kind: 'component',
        type: 'service',
        name: 'pasoe-totys-03p',
        title: 'PASOE-TOTYS (OCSL-TOTGPS-03P)',
        description: 'Progress Application Server for OpenEdge - TOTYS',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totgps-03p' },
      },
      {
        kind: 'component',
        type: 'service',
        name: 'tomcat-totys-03p',
        title: 'TOMCAT-TOTYS (OCSL-TOTGPS-03P)',
        description: 'Apache Tomcat - TOTYS',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totgps-03p' },
      },
      // TOTGPS-04P services
      {
        kind: 'component',
        type: 'service',
        name: 'pasoe-totys-04p',
        title: 'PASOE-TOTYS (OCSL-TOTGPS-04P)',
        description: 'Progress Application Server for OpenEdge - TOTYS',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totgps-04p' },
      },
      {
        kind: 'component',
        type: 'service',
        name: 'tomcat-totys-04p',
        title: 'TOMCAT-TOTYS (OCSL-TOTGPS-04P)',
        description: 'Apache Tomcat - TOTYS',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totgps-04p' },
      },
      // TOTSHE services
      {
        kind: 'component',
        type: 'service',
        name: 'sholder-hcm-01p',
        title: 'SHOLDER-HCM (OCSL-TOTSHE-01P)',
        description: 'SHOLDER HCM Service',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totshe-01p' },
      },
      {
        kind: 'component',
        type: 'service',
        name: 'sholder-totys-01p',
        title: 'SHOLDER-TOTYS (OCSL-TOTSHE-01P)',
        description: 'SHOLDER TOTYS Service',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totshe-01p' },
      },
      // TOTDFS services
      {
        kind: 'component',
        type: 'service',
        name: 'totys-dfs-01p',
        title: 'TOTYS-DFS (OCSL-TOTDFS-01P)',
        description: 'TOTYS Distributed File System',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totdfs-01p' },
      },
      {
        kind: 'component',
        type: 'service',
        name: 'hcm-dfs-01p',
        title: 'HCM-DFS (OCSL-TOTDFS-01P)',
        description: 'HCM Distributed File System',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totdfs-01p' },
      },
      // License Server services
      {
        kind: 'component',
        type: 'service',
        name: 'license-server-01p',
        title: 'LICENSE-SERVER (OCSL-TOTILIC-01P)',
        description: 'License Server for TOTVS Products',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totilic-01p' },
      },
      {
        kind: 'component',
        type: 'service',
        name: 'license-server-02p',
        title: 'LICENSE-SERVER (OCSL-TOTILIC-02P)',
        description: 'License Server for TOTVS Products',
        lifecycle: 'production',
        owner_team_id: team.id,
        organization_id: org.id,
        metadata: { server: 'ocsl-totilic-02p' },
      },
    ])
    .returning('*');

  // Find specific services for relationship creation
  const pasoe01 = services.find((s) => s.name === 'pasoe-totys-01p');
  const pasoe02 = services.find((s) => s.name === 'pasoe-totys-02p');
  const pasoe03 = services.find((s) => s.name === 'pasoe-totys-03p');
  const pasoe04 = services.find((s) => s.name === 'pasoe-totys-04p');
  const totysRef = services.find((s) => s.name === 'totys-dfs-01p');
  const sholderTotys = services.find((s) => s.name === 'sholder-totys-01p');

  if (!pasoe01 || !pasoe02 || !pasoe03 || !pasoe04 || !totysRef || !sholderTotys) {
    throw new Error('Falha ao recuperar IDs das entidades de serviço');
  }

  // Create relationships
  // PASOE dependencies
  const pasoeDependencies = [
    { sourceId: pasoe01.id, targetId: totysRef.id },
    { sourceId: pasoe01.id, targetId: sholderTotys.id },
    { sourceId: pasoe02.id, targetId: totysRef.id },
    { sourceId: pasoe02.id, targetId: sholderTotys.id },
    { sourceId: pasoe03.id, targetId: totysRef.id },
    { sourceId: pasoe03.id, targetId: sholderTotys.id },
    { sourceId: pasoe04.id, targetId: totysRef.id },
    { sourceId: pasoe04.id, targetId: sholderTotys.id },
  ];

  await knex('catalog_entity_relations').insert(
    pasoeDependencies.map((dep) => ({
      source_entity_id: dep.sourceId,
      target_entity_id: dep.targetId,
      relation_type: 'dependsOn',
      organization_id: org.id,
    })),
  );
}
