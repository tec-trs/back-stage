/**
 * Script para gerar dados de teste no Back-Stage CMDB
 * Gera servidores, bancos de dados, aplicações e relacionamentos aleatórios
 *
 * Uso: npm run seed:data
 */

// Configuração da API
const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const ORG_ID = process.env.ORG_ID || 'unimedpoa';
const EMAIL = process.env.EMAIL || 'admin';
const PASSWORD = process.env.PASSWORD || 'Tectrs123';

console.log('🌱 Iniciando geração de dados de teste...');
console.log(`📡 Conectando em: ${API_URL}`);

let authToken = '';
let organizationId = '';

// Tipos
interface Server {
  displayName: string;
  hostname: string;
  serverType: 'vm' | 'bare_metal' | 'container_host';
  provider?: string;
  environment: string;
  status: 'active' | 'deactivated';
  cpuCores: number;
  ramGb: number;
  osName: string;
  osVersion: string;
  description: string;
  privateIps: string[];
  ownerTeam: string;
}

interface Database {
  name: string;
  displayName: string;
  engine: string;
  version: string;
  port: number;
  environment: string;
  status: 'active' | 'deactivated';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ownerTeam: string;
}

interface Application {
  code: string;
  displayName: string;
  appType: string;
  environment: string;
  status: 'active' | 'deactivated';
  description: string;
  ownerTeam: string;
}

// Funções auxiliares
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomIp(): string {
  return `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`;
}

function randomName(prefix: string): string {
  const suffixes = ['prod', 'dev', 'stg', 'test', 'app', 'db', 'srv'];
  return `${prefix}-${randomItem(suffixes)}-${randomInt(1, 99)}`;
}

// Função para fazer requisições POST com autenticação
async function post<T>(path: string, body: any): Promise<T> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else {
      console.warn('⚠️  AVISO: Nenhum token de autenticação disponível!');
    }

    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`${response.status}: ${errorData}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`❌ Erro ao fazer POST ${path}:`, error);
    throw error;
  }
}

// Função para fazer login e obter token
async function login(): Promise<void> {
  console.log(`🔐 Autenticando como: ${EMAIL}`);
  try {
    // Step 1: Login com código e password
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: EMAIL,
        password: PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.error(`Erro de login (${loginResponse.status}):`, errorData);
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json() as any;

    if (loginData.status === 'select_org') {
      console.log('✅ Login realizado com sucesso!');
      console.log(`🏢 Selecionando organização: ${ORG_ID}`);

      const pendingToken = loginData.pendingToken;
      if (!pendingToken) {
        throw new Error('Nenhum pendingToken retornado pelo servidor');
      }

      // Encontrar o ID da organização pelo slug
      const organization = loginData.organizations.find(
        (org: any) => org.slug === ORG_ID || org.id === ORG_ID
      );

      if (!organization) {
        console.error('Organizações disponíveis:', loginData.organizations);
        throw new Error(`Organização ${ORG_ID} não encontrada nas opções disponíveis`);
      }

      console.log(`   ℹ️  Usando ID: ${organization.id}`);

      // Step 2: Selecionar organização
      const orgResponse = await fetch(`${API_URL}/auth/select-org`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pendingToken: pendingToken,
          organizationId: organization.id,
        }),
      });

      if (!orgResponse.ok) {
        const errorData = await orgResponse.text();
        console.error(`Erro ao selecionar organização (${orgResponse.status}):`, errorData);
        throw new Error(`Falha ao selecionar organização: ${orgResponse.status}`);
      }

      const orgData = await orgResponse.json() as any;
      authToken = orgData.access_token || orgData.token || orgData.accessToken;
      organizationId = organization.id;

      if (!authToken) {
        console.error('Resposta da select-org:', JSON.stringify(orgData, null, 2));
        throw new Error('Nenhum token de acesso retornado após seleção de organização');
      }

      console.log('✅ Organização selecionada com sucesso!');
      console.log(`📌 Token: ${authToken.substring(0, 20)}...`);
    } else {
      console.error('Resposta do login:', JSON.stringify(loginData, null, 2));
      throw new Error('Fluxo de login inesperado: status != select_org');
    }
  } catch (error) {
    console.error('❌ Erro ao autenticar:', error);
    throw error;
  }
}

// Geradores de dados
async function generateServers(): Promise<string[]> {
  console.log('📦 Gerando 8 servidores...');

  const serverTypes: Array<'vm' | 'bare_metal' | 'container_host'> = ['vm', 'bare_metal', 'container_host'];
  const osNames = ['Ubuntu', 'CentOS', 'Windows Server', 'Red Hat'];
  const ids: string[] = [];

  for (let i = 0; i < 8; i++) {
    const server: Server = {
      displayName: randomName('Servidor'),
      hostname: `host-${i + 1}.example.com`,
      serverType: randomItem(serverTypes),
      provider: randomItem(['on_premise', 'aws', 'azure', 'gcp', 'oracle_cloud', 'own_datacenter']),
      environment: randomItem(['production', 'staging', 'development']),
      status: randomItem(['active', 'deactivated']),
      cpuCores: randomInt(2, 32),
      ramGb: randomInt(8, 256),
      osName: randomItem(osNames),
      osVersion: `${randomInt(18, 22)}.04`,
      description: `Servidor ${i + 1} gerado automaticamente para testes`,
      privateIps: [randomIp(), randomIp()],
      ownerTeam: 'devops',
    };

    try {
      const result = await post<{ id: string }>(`/servers`, server);
      ids.push(result.id);
      console.log(`   ✓ Servidor criado: ${server.displayName} (${result.id})`);
    } catch (error) {
      console.error(`   ✗ Erro ao criar servidor ${server.displayName}`);
    }
  }

  return ids;
}

async function generateDatabases(): Promise<string[]> {
  console.log('💾 Gerando 6 bancos de dados...');

  const engines = ['postgresql', 'mysql', 'redis', 'mongodb', 'elasticsearch', 'mariadb'];
  const ids: string[] = [];

  for (let i = 0; i < 6; i++) {
    const engine = engines[i];
    const portMap: Record<string, number> = {
      postgresql: 5432,
      mysql: 3306,
      redis: 6379,
      mongodb: 27017,
      elasticsearch: 9200,
      mariadb: 3306,
    };

    const database: Database = {
      name: `${engine}-db-${i + 1}`,
      displayName: `${engine.charAt(0).toUpperCase() + engine.slice(1)} Database ${i + 1}`,
      engine: engine,
      version: `${randomInt(10, 16)}.${randomInt(0, 5)}`,
      port: portMap[engine],
      environment: randomItem(['production', 'staging', 'development']),
      status: randomItem(['active', 'deactivated']),
      criticality: randomItem(['low', 'medium', 'high', 'critical']),
      description: `Banco de dados ${engine} gerado automaticamente para testes`,
      ownerTeam: 'database-team',
    };

    try {
      const result = await post<{ id: string }>(`/databases`, database);
      ids.push(result.id);
      console.log(`   ✓ Banco criado: ${database.displayName} (${result.id})`);
    } catch (error) {
      console.error(`   ✗ Erro ao criar banco ${database.displayName}`);
    }
  }

  return ids;
}

async function generateApplications(): Promise<string[]> {
  console.log('🚀 Gerando 10 aplicações...');

  const appTypes = ['nodejs', 'django', 'spring', 'dotnet', 'go', 'rust', 'laravel', 'rails'];
  const ids: string[] = [];

  for (let i = 0; i < 10; i++) {
    const application: Application = {
      code: `app-${i + 1}-${randomInt(1000, 9999)}`,
      displayName: randomName('Aplicação'),
      appType: randomItem(appTypes),
      environment: randomItem(['production', 'staging', 'development']),
      status: randomItem(['active', 'deactivated']),
      description: `Aplicação ${i + 1} gerada automaticamente para testes`,
      ownerTeam: 'platform-team',
    };

    try {
      const result = await post<{ id: string }>(`/applications`, application);
      ids.push(result.id);
      console.log(`   ✓ Aplicação criada: ${application.displayName} (${result.id})`);
    } catch (error) {
      console.error(`   ✗ Erro ao criar aplicação ${application.displayName}`);
    }
  }

  return ids;
}

async function generateRelationships(
  serverIds: string[],
  databaseIds: string[],
  applicationIds: string[]
): Promise<void> {
  console.log('🔗 Gerando relacionamentos...');

  const map = await post<{ id: string }>(`/relationship-maps`, {
    name: `Mapa de teste ${new Date().toISOString()}`,
    description: 'Relacionamentos gerados automaticamente para testes',
  });

  // Criar alguns relacionamentos entre aplicações e bancos de dados
  for (let i = 0; i < Math.min(5, applicationIds.length, databaseIds.length); i++) {
    const relationship = {
      sourceType: 'application',
      sourceId: applicationIds[i],
      targetType: 'database',
      targetId: databaseIds[i],
      relationType: randomItem(['depends_on', 'consumes']),
    };

    try {
      await post(`/relationship-maps/${map.id}/relationships`, relationship);
      console.log(
        `   ✓ Relacionamento criado: ${relationship.sourceType} -> ${relationship.targetType}`
      );
    } catch (error) {
      console.error(`   ✗ Erro ao criar relacionamento`);
    }
  }

  // Criar alguns relacionamentos entre servidores e aplicações
  for (let i = 0; i < Math.min(5, serverIds.length, applicationIds.length); i++) {
    const relationship = {
      sourceType: 'server',
      sourceId: serverIds[i],
      targetType: 'application',
      targetId: applicationIds[i],
      relationType: 'hosts',
    };

    try {
      await post(`/relationship-maps/${map.id}/relationships`, relationship);
      console.log(
        `   ✓ Relacionamento criado: ${relationship.sourceType} -> ${relationship.targetType}`
      );
    } catch (error) {
      console.error(`   ✗ Erro ao criar relacionamento`);
    }
  }
}

// Função principal
async function main() {
  try {
    // Fazer login primeiro
    console.log('\n🔐 Iniciando autenticação...');
    await login();
    console.log('✅ Autenticação concluída!\n');

    const serverIds = await generateServers();
    const databaseIds = await generateDatabases();
    const applicationIds = await generateApplications();

    await generateRelationships(serverIds, databaseIds, applicationIds);

    console.log('\n✅ Geração de dados concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - Servidores: ${serverIds.length}`);
    console.log(`   - Bancos de dados: ${databaseIds.length}`);
    console.log(`   - Aplicações: ${applicationIds.length}`);
    console.log('\n🌐 Acesse:');
    console.log('   - Servidores: http://localhost:5173/servers');
    console.log('   - Bancos: http://localhost:5173/databases');
    console.log('   - Aplicações: http://localhost:5173/applications');
    console.log('   - Ecossistema: http://localhost:5173/ecosystem');
    console.log('   - Relacionamentos: http://localhost:5173/relationship-maps');
  } catch (error) {
    console.error('\n❌ Erro ao gerar dados:', error);
    console.log('\n💡 Dicas:');
    console.log('  1. Certifique-se de que o backend está rodando: npm run dev:backend');
    console.log('  2. Verifique se a porta 4000 está disponível');
    console.log('  3. Verifique as credenciais de autenticação:');
    console.log(`     - EMAIL: ${EMAIL}`);
    console.log(`     - PASSWORD: ${PASSWORD}`);
    console.log('  4. Para usar credenciais diferentes, defina variáveis de ambiente:');
    console.log('     $env:EMAIL="seu@email.com"; $env:PASSWORD="sua-senha"; npm run seed:data');
    process.exit(1);
  }
}

main();
