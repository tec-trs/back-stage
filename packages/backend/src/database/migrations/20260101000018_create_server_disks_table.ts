import type { Knex } from 'knex';

const TABLE_NAME = 'server_disks';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('server_id').notNullable().references('id').inTable('servers').onDelete('CASCADE');
    table.string('mount_point', 255).notNullable();
    table.integer('capacity_gb').notNullable();
    table.string('disk_type', 20).notNullable();
    table.string('purpose', 20).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['server_id'], 'server_disks_server_id_index');
    table.check("disk_type in ('ssd', 'hdd', 'nvme')", [], 'server_disks_disk_type_check');
    table.check(
      "purpose in ('system', 'data', 'log', 'backup')",
      [],
      'server_disks_purpose_check',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
