import type { Knex } from 'knex';

const TABLE_NAME = 'server_groups';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('vip_hostname', 255).nullable().comment('VIP hostname (ex: ls.totvs.com.br)');
    table.string('vip_address', 45).nullable().comment('VIP IP address (IPv4 or IPv6)');
    table.string('load_balancer_type', 50).nullable().comment('Type: round_robin, weighted, least_conn, etc');
    table.integer('health_check_interval').nullable().defaultTo(30).comment('Health check interval in seconds');
    table.string('health_check_path', 255).nullable().comment('Health check path for HTTP');
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS server_groups_vip_hostname_index
    ON ${TABLE_NAME}(vip_hostname)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS server_groups_vip_hostname_index`);
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('vip_hostname');
    table.dropColumn('vip_address');
    table.dropColumn('load_balancer_type');
    table.dropColumn('health_check_interval');
    table.dropColumn('health_check_path');
  });
}
