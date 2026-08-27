const { Pool } = require('pg');

const pool = new Pool({
  user: 'backstage',
  password: 'backstage',
  host: 'localhost',
  port: 5432,
  database: 'backstage',
});

async function cleanRelationships() {
  try {
    console.log('🧹 Limpando todos os relacionamentos...');

    // Delete all relationships
    const result = await pool.query(
      `DELETE FROM resource_relationships`
    );

    console.log(`✅ ${result.rowCount} relacionamentos deletados`);

    // Reset sequences if any
    await pool.query(`
      ALTER SEQUENCE IF EXISTS resource_relationships_id_seq RESTART WITH 1
    `);

    console.log('✅ Pronto! Comece do zero!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
}

cleanRelationships();
