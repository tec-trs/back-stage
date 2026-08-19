import { db, closeDatabaseConnection } from '../database/connection.js';

/**
 * Remove relacionamentos cujos recursos de origem ou destino não existem mais
 * Executa: cd packages/backend && npx tsx src/scripts/cleanup-orphaned-relationships.ts
 */
async function cleanupOrphanedRelationships() {

  try {
    console.log('🧹 Iniciando limpeza de relacionamentos órfãos...\n');

    // Contar relacionamentos antes
    const countBefore = await db('resource_relationships').count('* as total').first();
    console.log(`📊 Relacionamentos antes: ${countBefore?.total || 0}`);

    // Encontrar órfãos: origem não existe
    const orphanedBySource = await db('resource_relationships as rr')
      .leftJoin('servers as s', function () {
        this.on('rr.source_id', '=', 's.id')
          .andOn('rr.source_type', '=', db.raw("'server'"))
          .andOn('rr.organization_id', '=', 's.organization_id');
      })
      .leftJoin('applications as a', function () {
        this.on('rr.source_id', '=', 'a.id')
          .andOn('rr.source_type', '=', db.raw("'application'"))
          .andOn('rr.organization_id', '=', 'a.organization_id');
      })
      .leftJoin('databases as d', function () {
        this.on('rr.source_id', '=', 'd.id')
          .andOn('rr.source_type', '=', db.raw("'database'"))
          .andOn('rr.organization_id', '=', 'd.organization_id');
      })
      .leftJoin('urls as u', function () {
        this.on('rr.source_id', '=', 'u.id')
          .andOn('rr.source_type', '=', db.raw("'url'"))
          .andOn('rr.organization_id', '=', 'u.organization_id');
      })
      .where('rr.deleted_at', null)
      .whereRaw('s.id IS NULL AND a.id IS NULL AND d.id IS NULL AND u.id IS NULL')
      .select('rr.id', 'rr.source_type', 'rr.source_id', 'rr.target_type', 'rr.target_id');

    // Encontrar órfãos: destino não existe
    const orphanedByTarget = await db('resource_relationships as rr')
      .leftJoin('servers as s', function () {
        this.on('rr.target_id', '=', 's.id')
          .andOn('rr.source_type', '=', db.raw("'server'"))
          .andOn('rr.organization_id', '=', 's.organization_id');
      })
      .leftJoin('applications as a', function () {
        this.on('rr.target_id', '=', 'a.id')
          .andOn('rr.source_type', '=', db.raw("'application'"))
          .andOn('rr.organization_id', '=', 'a.organization_id');
      })
      .leftJoin('databases as d', function () {
        this.on('rr.target_id', '=', 'd.id')
          .andOn('rr.source_type', '=', db.raw("'database'"))
          .andOn('rr.organization_id', '=', 'd.organization_id');
      })
      .leftJoin('urls as u', function () {
        this.on('rr.target_id', '=', 'u.id')
          .andOn('rr.source_type', '=', db.raw("'url'"))
          .andOn('rr.organization_id', '=', 'u.organization_id');
      })
      .where('rr.deleted_at', null)
      .whereRaw('s.id IS NULL AND a.id IS NULL AND d.id IS NULL AND u.id IS NULL')
      .select('rr.id', 'rr.source_type', 'rr.source_id', 'rr.target_type', 'rr.target_id');

    const orphanedIds = new Set<string>();
    (orphanedBySource as any[]).forEach((r: any) => orphanedIds.add(r.id));
    (orphanedByTarget as any[]).forEach((r: any) => orphanedIds.add(r.id));

    if (orphanedIds.size === 0) {
      console.log('✅ Nenhum relacionamento órfão encontrado!');
      await closeDatabaseConnection();
      return;
    }

    console.log(`\n⚠️  Encontrados ${orphanedIds.size} relacionamentos órfãos:`);

    // Listar os órfãos
    (orphanedBySource as any[]).forEach((r: any) => {
      console.log(`  - ${r.source_type}:${r.source_id} → ${r.target_type}:${r.target_id} (origem não existe)`);
    });
    (orphanedByTarget as any[]).forEach((r: any) => {
      console.log(`  - ${r.source_type}:${r.source_id} → ${r.target_type}:${r.target_id} (destino não existe)`);
    });

    // Deletar (soft delete com deleted_at)
    const orphanedIdArray = Array.from(orphanedIds);
    console.log(`\n🗑️  Deletando ${orphanedIdArray.length} relacionamentos...`);

    await db('resource_relationships')
      .whereIn('id', orphanedIdArray)
      .update({
        deleted_at: new Date(),
      });

    // Verificar resultado
    const countAfter = await db('resource_relationships').whereNull('deleted_at').count('* as total').first();
    console.log(`\n✅ Limpeza concluída!`);
    console.log(`📊 Relacionamentos após: ${countAfter?.total || 0}`);
    console.log(`📉 Removidos: ${orphanedIdArray.length}`);

    await db.destroy();
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    await db.destroy();
    process.exit(1);
  }
}

cleanupOrphanedRelationships();
