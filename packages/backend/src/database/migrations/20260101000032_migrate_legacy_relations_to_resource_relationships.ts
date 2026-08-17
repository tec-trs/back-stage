import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Migrar application_deployments (server -> application, relacao "hosts")
  await knex.raw(`
    INSERT INTO resource_relationships (source_type, source_id, target_type, target_id, relation_type, metadata, created_at, updated_at)
    SELECT
      'server' as source_type,
      server_id as source_id,
      'application' as target_type,
      application_id as target_id,
      'hosts' as relation_type,
      jsonb_build_object(
        'environment', environment,
        'ports', ports,
        'deployed_version', deployed_version,
        'deploy_method', deploy_method,
        'access_url', access_url
      ) as metadata,
      COALESCE(created_at, NOW()) as created_at,
      COALESCE(updated_at, NOW()) as updated_at
    FROM application_deployments
    WHERE deleted_at IS NULL
  `);

  // Migrar application_dependencies (application -> application, relacao "depends_on")
  await knex.raw(`
    INSERT INTO resource_relationships (source_type, source_id, target_type, target_id, relation_type, created_at, updated_at)
    SELECT
      'application' as source_type,
      application_id as source_id,
      'application' as target_type,
      depends_on_application_id as target_id,
      'depends_on' as relation_type,
      COALESCE(created_at, NOW()) as created_at,
      NOW() as updated_at
    FROM application_dependencies
    WHERE deleted_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Migration de dados não é revertida - revertir exigiria backup
  // Este é um ponto de não-retorno parcial, conforme documentado no plano
  throw new Error('Essa migration de dados nao pode ser revertida. Restaure via backup de banco de dados se necessario.');
}
