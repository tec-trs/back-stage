import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgres://backstage:backstage@127.0.0.1:5432/backstage',
});

async function main() {
  try {
    console.log('📍 Buscando URL "tot"...');
    const url = await db('urls')
      .where({ label: 'tot' })
      .whereNull('deleted_at')
      .first();

    if (!url) {
      console.error('❌ URL "tot" não encontrada');
      process.exit(1);
    }

    console.log(`✅ URL encontrada: ${url.id} - ${url.label}`);

    console.log('📍 Buscando grupo "TOTVSGPS"...');
    const group = await db('server_groups')
      .where({ name: 'TOTVSGPS' })
      .whereNull('deleted_at')
      .first();

    if (!group) {
      console.error('❌ Grupo "TOTVSGPS" não encontrado');
      console.log('📋 Grupos disponíveis:');
      const groups = await db('server_groups').whereNull('deleted_at');
      groups.forEach(g => console.log(`   - ${g.id}: ${g.name}`));
      process.exit(1);
    }

    console.log(`✅ Grupo encontrado: ${group.id} - ${group.name}`);

    // Verificar se já existe relacionamento
    const existing = await db('resource_relationships')
      .where({
        source_type: 'url',
        source_id: url.id,
        target_type: 'group',
        target_id: group.id,
        relation_type: 'depends_on',
      })
      .whereNull('deleted_at')
      .first();

    if (existing) {
      console.log('⚠️  Relacionamento já existe');
      process.exit(0);
    }

    console.log('🔗 Criando relacionamento: URL depends_on GROUP...');
    await db('resource_relationships').insert({
      source_type: 'url',
      source_id: url.id,
      target_type: 'group',
      target_id: group.id,
      relation_type: 'depends_on',
      organization_id: url.organization_id,
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Relacionamento criado com sucesso!');
    console.log(`   tot (URL) depends_on GPS (Group)`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

main();
