import type { Knex } from 'knex';

/**
 * Dados de demonstracao:
 *
 * Servidor juca (Windows)
 *   └─ servicos: fileserver, licenseserver
 *
 * Servidor zeca (Linux)
 *   └─ servicos: admin-server, fathom (http://zeca:9090), pasoe
 *   └─ bancos: banco1, banco2, banco3
 *   └─ pasoe depends_on banco1/2/3 e fileserver (juca)
 *
 * Servidor xurumela
 *   └─ servico: tomcat
 *   └─ tomcat depends_on pasoe (zeca) e licenseserver (juca)
 *
 * Aplicacao TOTVS
 *   └─ url: http://totvs.tectrs.com.br
 *   └─ deployada em xurumela
 *   └─ depends_on xurumela (tomcat)
 */

type ServicesJson = Array<{
  seq: number;
  name: string;
  commandStart: string | null;
  commandStop: string | null;
  commandStatus: string | null;
  ports: number[];
  status: 'active' | 'inactive';
  observations: string | null;
}>;

function svc(
  seq: number,
  name: string,
  ports: number[] = [],
  observations: string | null = null,
): ServicesJson[number] {
  return {
    seq,
    name,
    commandStart: null,
    commandStop: null,
    commandStatus: null,
    ports,
    status: 'active',
    observations,
  };
}

export async function seed(knex: Knex): Promise<void> {
  // ── Limpeza (idempotente) ────────────────────────────────────────────────

  const hostnames = ['juca', 'zeca', 'xurumela'];
  const dbNames = ['banco1', 'banco2', 'banco3'];
  const appCode = 'totvs';
  const urlPaths = ['http://zeca:9090', 'http://totvs.tectrs.com.br'];

  // Busca IDs existentes para limpar relacionamentos primeiro
  const existingServers = await knex('servers')
    .whereIn('hostname', hostnames)
    .whereNull('deleted_at')
    .select('id');
  const existingDbs = await knex('databases')
    .whereIn('name', dbNames)
    .whereNull('deleted_at')
    .select('id');
  const existingApps = await knex('applications')
    .where('code', appCode)
    .whereNull('deleted_at')
    .select('id');
  const existingUrls = await knex('urls')
    .whereIn('url', urlPaths)
    .whereNull('deleted_at')
    .select('id');

  const allIds = [
    ...existingServers.map((r: { id: string }) => r.id),
    ...existingDbs.map((r: { id: string }) => r.id),
    ...existingApps.map((r: { id: string }) => r.id),
    ...existingUrls.map((r: { id: string }) => r.id),
  ];

  if (allIds.length > 0) {
    await knex('resource_relationships')
      .where((b) => {
        b.whereIn('source_id', allIds).orWhereIn('target_id', allIds);
      })
      .del();
  }

  await knex('urls').whereIn('url', urlPaths).del();
  await knex('application_deployments')
    .whereIn(
      'application_id',
      existingApps.map((r: { id: string }) => r.id),
    )
    .del();
  await knex('applications').where('code', appCode).del();
  await knex('databases').whereIn('name', dbNames).update({ deleted_at: knex.fn.now() });
  await knex('servers').whereIn('hostname', hostnames).update({ deleted_at: knex.fn.now() });

  // ── Servidores ────────────────────────────────────────────────────────────

  const [juca] = (await knex('servers')
    .insert({
      hostname: 'juca',
      display_name: 'Servidor Juca',
      description: 'Servidor Windows — fileserver e licenseserver',
      server_type: 'bare_metal',
      provider: 'on_premise',
      os_name: 'Windows Server',
      os_version: '2019',
      environment: 'production',
      status: 'active',
      private_ips: ['192.168.1.10'],
      tags: ['windows', 'producao'],
      services: JSON.stringify([
        svc(1, 'fileserver', [445], 'Compartilhamento de arquivos SMB'),
        svc(2, 'licenseserver', [1947], 'Gerenciamento de licencas HASP/CODEMETER'),
      ] satisfies ServicesJson),
      metadata: JSON.stringify({}),
    })
    .returning(['id', 'hostname'])) as Array<{ id: string; hostname: string }>;

  const [zeca] = (await knex('servers')
    .insert({
      hostname: 'zeca',
      display_name: 'Servidor Zeca',
      description: 'Servidor Linux — admin, fathom, bancos e pasoe',
      server_type: 'vm',
      provider: 'on_premise',
      os_name: 'Ubuntu',
      os_version: '22.04',
      environment: 'production',
      status: 'active',
      private_ips: ['192.168.1.20'],
      tags: ['linux', 'producao', 'appserver'],
      services: JSON.stringify([
        svc(1, 'admin-server', [22], 'Servico de administracao'),
        svc(2, 'fathom', [9090], 'Analytics — interface em http://zeca:9090'),
        svc(3, 'pasoe', [8843], 'OpenEdge PASOE — depende dos bancos e do fileserver (juca)'),
      ] satisfies ServicesJson),
      metadata: JSON.stringify({}),
    })
    .returning(['id', 'hostname'])) as Array<{ id: string; hostname: string }>;

  const [xurumela] = (await knex('servers')
    .insert({
      hostname: 'xurumela',
      display_name: 'Servidor Xurumela',
      description: 'Servidor de aplicacao — tomcat',
      server_type: 'vm',
      provider: 'on_premise',
      os_name: 'Linux',
      environment: 'production',
      status: 'active',
      private_ips: ['192.168.1.30'],
      tags: ['linux', 'producao', 'java'],
      services: JSON.stringify([
        svc(1, 'tomcat', [8080], 'Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)'),
      ] satisfies ServicesJson),
      metadata: JSON.stringify({}),
    })
    .returning(['id', 'hostname'])) as Array<{ id: string; hostname: string }>;

  // ── Bancos de dados (hospedados no zeca) ─────────────────────────────────

  const [banco1] = (await knex('databases')
    .insert({
      name: 'banco1',
      display_name: 'Banco1',
      description: 'Banco de dados OpenEdge 1',
      engine: 'other',
      version: '12.2',
      port: 8610,
      hosted_on_server_id: zeca.id,
      connection_host: 'zeca',
      is_managed_service: false,
      criticality: 'critical',
      owner_team: 'Infraestrutura',
      has_backup: true,
      backup_policy: 'Diario as 02h',
      status: 'active',
      environment: 'production',
      tags: ['openedge', 'producao'],
      metadata: JSON.stringify({}),
    })
    .returning(['id', 'name'])) as Array<{ id: string; name: string }>;

  const [banco2] = (await knex('databases')
    .insert({
      name: 'banco2',
      display_name: 'Banco2',
      description: 'Banco de dados OpenEdge 2',
      engine: 'other',
      version: '12.2',
      port: 8620,
      hosted_on_server_id: zeca.id,
      connection_host: 'zeca',
      is_managed_service: false,
      criticality: 'critical',
      owner_team: 'Infraestrutura',
      has_backup: true,
      backup_policy: 'Diario as 02h',
      status: 'active',
      environment: 'production',
      tags: ['openedge', 'producao'],
      metadata: JSON.stringify({}),
    })
    .returning(['id', 'name'])) as Array<{ id: string; name: string }>;

  const [banco3] = (await knex('databases')
    .insert({
      name: 'banco3',
      display_name: 'Banco3',
      description: 'Banco de dados OpenEdge 3',
      engine: 'other',
      version: '12.2',
      port: 8630,
      hosted_on_server_id: zeca.id,
      connection_host: 'zeca',
      is_managed_service: false,
      criticality: 'high',
      owner_team: 'Infraestrutura',
      has_backup: true,
      backup_policy: 'Diario as 02h',
      status: 'active',
      environment: 'production',
      tags: ['openedge', 'producao'],
      metadata: JSON.stringify({}),
    })
    .returning(['id', 'name'])) as Array<{ id: string; name: string }>;

  // ── Aplicacao TOTVS ───────────────────────────────────────────────────────

  const [totvsApp] = (await knex('applications')
    .insert({
      code: 'totvs',
      display_name: 'TOTVS',
      description: 'Sistema ERP TOTVS — frontend em http://totvs.tectrs.com.br',
      app_type: 'web',
      business_category: 'ERP',
      criticality: 'critical',
      status: 'active',
      owner_team: 'Infraestrutura',
      metadata: JSON.stringify({}),
    })
    .returning(['id', 'code'])) as Array<{ id: string; code: string }>;

  // Deployment: TOTVS roda no xurumela
  await knex('application_deployments').insert({
    application_id: totvsApp.id,
    server_id: xurumela.id,
    environment: 'production',
  });

  // ── URLs ─────────────────────────────────────────────────────────────────

  // Fathom — monitoramento no zeca
  await knex('urls').insert({
    label: 'Fathom Analytics',
    url: 'http://zeca:9090',
    url_type: 'monitoring',
    description: 'Interface web do Fathom Analytics no servidor zeca',
    owner_resource_type: 'server',
    owner_resource_id: zeca.id,
    method: 'GET',
    auth_required: false,
    status: 'active',
    healthcheck_enabled: true,
    tags: ['monitoring', 'fathom'],
    metadata: JSON.stringify({}),
  });

  // TOTVS — frontend publico
  await knex('urls').insert({
    label: 'Portal TOTVS',
    url: 'http://totvs.tectrs.com.br',
    url_type: 'frontend',
    description: 'Portal web do sistema TOTVS',
    owner_resource_type: 'application',
    owner_resource_id: totvsApp.id,
    method: 'GET',
    auth_required: true,
    auth_method: 'form',
    status: 'active',
    healthcheck_enabled: true,
    tags: ['totvs', 'erp', 'producao'],
    metadata: JSON.stringify({}),
  });

  // ── Relacionamentos no grafo ──────────────────────────────────────────────

  await knex('resource_relationships').insert([
    // zeca hospeda os tres bancos
    { source_type: 'server', source_id: zeca.id, target_type: 'database', target_id: banco1.id, relation_type: 'hosts', metadata: JSON.stringify({ note: 'zeca hospeda banco1' }) },
    { source_type: 'server', source_id: zeca.id, target_type: 'database', target_id: banco2.id, relation_type: 'hosts', metadata: JSON.stringify({ note: 'zeca hospeda banco2' }) },
    { source_type: 'server', source_id: zeca.id, target_type: 'database', target_id: banco3.id, relation_type: 'hosts', metadata: JSON.stringify({ note: 'zeca hospeda banco3' }) },

    // pasoe (zeca) depende do fileserver (juca) — modelado como server→server
    { source_type: 'server', source_id: zeca.id, target_type: 'server', target_id: juca.id, relation_type: 'depends_on', metadata: JSON.stringify({ service: 'pasoe→fileserver', note: 'pasoe no zeca depende do fileserver no juca' }) },

    // tomcat (xurumela) depende do pasoe (zeca) e do licenseserver (juca)
    { source_type: 'server', source_id: xurumela.id, target_type: 'server', target_id: zeca.id, relation_type: 'depends_on', metadata: JSON.stringify({ service: 'tomcat→pasoe', note: 'tomcat no xurumela depende do pasoe no zeca' }) },
    { source_type: 'server', source_id: xurumela.id, target_type: 'server', target_id: juca.id, relation_type: 'depends_on', metadata: JSON.stringify({ service: 'tomcat→licenseserver', note: 'tomcat no xurumela depende do licenseserver no juca' }) },

    // TOTVS (app) depende do tomcat (xurumela)
    { source_type: 'application', source_id: totvsApp.id, target_type: 'server', target_id: xurumela.id, relation_type: 'depends_on', metadata: JSON.stringify({ service: 'totvs→tomcat', note: 'TOTVS depende do tomcat no xurumela' }) },

    // pasoe (zeca) consome os tres bancos — banco→server direction via consumes
    { source_type: 'server', source_id: zeca.id, target_type: 'database', target_id: banco1.id, relation_type: 'depends_on', metadata: JSON.stringify({ service: 'pasoe→banco1' }) },
    { source_type: 'server', source_id: zeca.id, target_type: 'database', target_id: banco2.id, relation_type: 'depends_on', metadata: JSON.stringify({ service: 'pasoe→banco2' }) },
    { source_type: 'server', source_id: zeca.id, target_type: 'database', target_id: banco3.id, relation_type: 'depends_on', metadata: JSON.stringify({ service: 'pasoe→banco3' }) },
  ]);

  console.log('✓ Demo data inserted successfully');
  console.log(`  Servers: juca (${juca.id}), zeca (${zeca.id}), xurumela (${xurumela.id})`);
  console.log(`  Databases: banco1 (${banco1.id}), banco2 (${banco2.id}), banco3 (${banco3.id})`);
  console.log(`  Application: TOTVS (${totvsApp.id})`);
}
