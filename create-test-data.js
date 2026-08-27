const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'backstage',
});

async function createTestData() {
  try {
    const orgId = '3ebf45d7-7e5d-4297-9116-f8d679ec0208';
    const urlId = 'c4aab143-c123-44bc-884c-af9620e069e8';

    // Verificar se já existe relacionamento
    const existing = await pool.query(
      `SELECT id FROM resource_relationships
       WHERE target_id = $1 AND target_type = 'url' AND relation_type = 'exposes'`,
      [urlId]
    );

    if (existing.rows.length > 0) {
      console.log('Relacionamento já existe');
      return;
    }

    // Obter uma aplicação
    const appResult = await pool.query(
      `SELECT id FROM applications WHERE organization_id = $1 LIMIT 1`,
      [orgId]
    );

    if (appResult.rows.length === 0) {
      console.log('Nenhuma aplicação encontrada');
      return;
    }

    const appId = appResult.rows[0].id;

    // Criar relacionamento
    await pool.query(
      `INSERT INTO resource_relationships
       (id, organization_id, source_type, source_id, target_type, target_id, relation_type, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'application', $2, 'url', $3, 'exposes', NOW(), NOW())`,
      [orgId, appId, urlId]
    );

    console.log('Relacionamento criado com sucesso!');
    console.log(`Aplicação ${appId} agora expõe a URL ${urlId}`);
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await pool.end();
  }
}

createTestData();
