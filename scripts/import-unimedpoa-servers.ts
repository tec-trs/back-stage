/**
 * Importacao dos servidores da Unimed POA para a organizacao 'unimedpoa'.
 * Run: npx tsx scripts/import-unimedpoa-servers.ts
 */
import 'dotenv/config';
import knexFactory from 'knex';

const db = knexFactory({
  client: 'pg',
  connection: process.env.DATABASE_URL ?? 'postgres://backstage:backstage@localhost:5432/backstage',
});

// Dados do CSV D:\_lixo\00.infra-unimedpoa.CSV (separador ;, encoding CP1252)
// Campos: hostname | displayName | serverType | provider | environment | ipAddress | domain | fqdn | osName | osVersion | cpuCores | ramGb | ownerTeam | description
// Mapeamentos aplicados:
//   provider "Cloud"    → oracle_cloud
//   env "Produção"      → producao
//   env "Homologação"   → homologacao
//   env "Desenvolvimento" → desenvolvimento
//   serverType          → slugificado (lowercase + hífen)
const RAW_SERVERS: Array<{
  hostname: string;
  displayName: string;
  serverType: string;
  environment: string;
  ipAddress: string | null;
  domain: string | null;
  fqdn: string | null;
  osName: string | null;
}> = [
  { hostname: 'OCSL-TOTBOL-01P', displayName: 'OCSL-TOTBOL-01P', serverType: 'boletos',                   environment: 'producao',       ipAddress: '172.31.34.255', domain: 'unimedpoa.com.br', fqdn: null, osName: 'CentOS'       },
  { hostname: 'OCSW-TOTHCM-02P', displayName: 'OCSW-TOTHCM-02P', serverType: 'catracas',                  environment: 'producao',       ipAddress: '172.31.33.32',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-FSTOTV-01P', displayName: 'OCSW-FSTOTV-01P', serverType: 'fileserver-totvs',          environment: 'producao',       ipAddress: '172.31.36.19',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVL-FLUIG-01D',  displayName: 'OCVL-FLUIG-01D',  serverType: 'fluig',                     environment: 'desenvolvimento', ipAddress: '172.20.70.155', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCVW-FLUIG-02D',  displayName: 'OCVW-FLUIG-02D',  serverType: 'fluig',                     environment: 'desenvolvimento', ipAddress: '172.20.64.137', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVL-FLUIG-01H',  displayName: 'OCVL-FLUIG-01H',  serverType: 'fluig',                     environment: 'homologacao',    ipAddress: '172.20.68.229', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCVL-FLUIG-02H',  displayName: 'OCVL-FLUIG-02H',  serverType: 'fluig',                     environment: 'homologacao',    ipAddress: '172.20.67.107', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCVL-FLUIG-03H',  displayName: 'OCVL-FLUIG-03H',  serverType: 'fluig',                     environment: 'homologacao',    ipAddress: '172.20.67.107', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCSV-FLUIG-01P',  displayName: 'OCSV-FLUIG-01P',  serverType: 'fluig',                     environment: 'producao',       ipAddress: '172.31.35.250', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCSV-FLUIG-02P',  displayName: 'OCSV-FLUIG-02P',  serverType: 'fluig',                     environment: 'producao',       ipAddress: '172.31.33.62',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCSV-FLUIG-03P',  displayName: 'OCSV-FLUIG-03P',  serverType: 'fluig',                     environment: 'producao',       ipAddress: '172.31.39.20',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCSV-FLUIG-08P',  displayName: 'OCSV-FLUIG-08P',  serverType: 'fluig',                     environment: 'producao',       ipAddress: '172.31.35.34',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCSW-FLUIG-04P',  displayName: 'OCSW-FLUIG-04P',  serverType: 'fluig',                     environment: 'producao',       ipAddress: '172.31.35.65',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-FLUIG-05P',  displayName: 'OCSW-FLUIG-05P',  serverType: 'fluig',                     environment: 'producao',       ipAddress: '172.31.37.243', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-FLUIG-06P',  displayName: 'OCSW-FLUIG-06P',  serverType: 'fluig',                     environment: 'producao',       ipAddress: '172.31.35.4',   domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-FLUIG-07P',  displayName: 'OCSW-FLUIG-07P',  serverType: 'fluig',                     environment: 'producao',       ipAddress: '172.31.34.144', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Linux'        },
  { hostname: 'OCSL-TOTLIC-01P', displayName: 'OCSL-TOTLIC-01P', serverType: 'license-server',            environment: 'producao',       ipAddress: '172.31.32.100', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTLIC-02P', displayName: 'OCSL-TOTLIC-02P', serverType: 'license-server',            environment: 'producao',       ipAddress: '172.31.34.181', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSW-TOTLIC-01P', displayName: 'OCSW-TOTLIC-01P', serverType: 'license-server',            environment: 'producao',       ipAddress: '172.31.36.109', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTLIC-02P', displayName: 'OCSW-TOTLIC-02P', serverType: 'license-server',            environment: 'producao',       ipAddress: '172.31.34.168', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  // OCVL-TOTLIC-01H aparece 2x no CSV com IPs diferentes; importando apenas a primeira ocorrencia
  { hostname: 'OCVL-TOTLIC-01H', displayName: 'OCVL-TOTLIC-01H', serverType: 'license-server',            environment: 'homologacao',    ipAddress: '172.20.65.157', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTOUV-01P', displayName: 'OCSL-TOTOUV-01P', serverType: 'ouvidor',                   environment: 'producao',       ipAddress: '172.31.36.95',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTOUV-02P', displayName: 'OCSL-TOTOUV-02P', serverType: 'ouvidor',                   environment: 'producao',       ipAddress: '172.31.37.76',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTOUV-03P', displayName: 'OCSL-TOTOUV-03P', serverType: 'ouvidor',                   environment: 'producao',       ipAddress: '172.31.36.186', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSW-TOTRPO-01P', displayName: 'OCSW-TOTRPO-01P', serverType: 'ouvidor',                   environment: 'producao',       ipAddress: '172.31.34.137', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTRPO-02P', displayName: 'OCSW-TOTRPO-02P', serverType: 'ouvidor',                   environment: 'producao',       ipAddress: '172.31.32.98',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTRPO-03P', displayName: 'OCSW-TOTRPO-03P', serverType: 'ouvidor',                   environment: 'producao',       ipAddress: '172.31.32.59',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVW-TOTRPO-01D', displayName: 'OCVW-TOTRPO-01D', serverType: 'ouvidor',                   environment: 'producao',       ipAddress: '172.20.67.198', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVW-TOTRPO-03H', displayName: 'OCVW-TOTRPO-03H', serverType: 'ouvidor',                   environment: 'producao',       ipAddress: '172.20.69.202', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSL-TOTGPS-01P', displayName: 'OCSL-TOTGPS-01P', serverType: 'pasoe-tomcat',              environment: 'producao',       ipAddress: '172.31.36.52',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTGPS-02P', displayName: 'OCSL-TOTGPS-02P', serverType: 'pasoe-tomcat',              environment: 'producao',       ipAddress: '172.31.32.127', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTGPS-03P', displayName: 'OCSL-TOTGPS-03P', serverType: 'pasoe-tomcat',              environment: 'producao',       ipAddress: '172.31.36.5',   domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTGPS-04P', displayName: 'OCSL-TOTGPS-04P', serverType: 'pasoe-tomcat',              environment: 'producao',       ipAddress: '172.31.37.7',   domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTGPS-05P', displayName: 'OCSL-TOTGPS-05P', serverType: 'pasoe-tomcat',              environment: 'producao',       ipAddress: '172.31.39.181', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTHCM-01P', displayName: 'OCSL-TOTHCM-01P', serverType: 'pasoe-tomcat',              environment: 'producao',       ipAddress: '172.31.36.2',   domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCVL-TOTGPS-01D', displayName: 'OCVL-TOTGPS-01D', serverType: 'pasoe-tomcat',              environment: 'producao',       ipAddress: '172.20.67.253', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCVL-TOTGPS-01H', displayName: 'OCVL-TOTGPS-01H', serverType: 'pasoe-tomcat',              environment: 'producao',       ipAddress: '172.20.68.56',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCVL-TOTHCM-01H', displayName: 'OCVL-TOTHCM-01H', serverType: 'pasoe-tomcat',              environment: 'homologacao',    ipAddress: '172.20.65.238', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTFEJ-01P', displayName: 'OCSL-TOTFEJ-01P', serverType: 'pasoe-tomcat-fora-balance', environment: 'producao',       ipAddress: '172.31.35.118', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTASV-01P', displayName: 'OCSL-TOTASV-01P', serverType: 'pasoe-fluig',               environment: 'producao',       ipAddress: '172.31.38.106', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTASV-02P', displayName: 'OCSL-TOTASV-02P', serverType: 'pasoe-fluig',               environment: 'producao',       ipAddress: '172.31.35.212', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTFDT-01P', displayName: 'OCSL-TOTFDT-01P', serverType: 'ptu',                       environment: 'producao',       ipAddress: '172.31.33.74',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'CentOS'       },
  { hostname: 'OCSL-TOTFDT-02P', displayName: 'OCSL-TOTFDT-02P', serverType: 'ptu',                       environment: 'producao',       ipAddress: '172.31.36.252', domain: 'unimedpoa.com.br', fqdn: null, osName: 'CentOS'       },
  { hostname: 'OCSL-TOTFDT-03P', displayName: 'OCSL-TOTFDT-03P', serverType: 'ptu',                       environment: 'producao',       ipAddress: '172.31.34.131', domain: 'unimedpoa.com.br', fqdn: null, osName: 'CentOS'       },
  { hostname: 'OCSL-TOTFDT-04P', displayName: 'OCSL-TOTFDT-04P', serverType: 'ptu',                       environment: 'producao',       ipAddress: '172.31.39.178', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCVL-TOTFDT-01H', displayName: 'OCVL-TOTFDT-01H', serverType: 'ptu',                       environment: 'desenvolvimento', ipAddress: '172.20.69.199', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTSHR-01P', displayName: 'OCSL-TOTSHR-01P', serverType: 'schema-holder',             environment: 'producao',       ipAddress: '172.31.36.31',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCVL-TOTSHR-01H', displayName: 'OCVL-TOTSHR-01H', serverType: 'schema-holder',             environment: 'homologacao',    ipAddress: '172.20.71.169', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCVW-TOTCSR-01H', displayName: 'OCVW-TOTCSR-01H', serverType: 'taf',                       environment: 'homologacao',    ipAddress: '172.20.66.59',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OSW-TAFCOB-01P',  displayName: 'OSW-TAFCOB-01P',  serverType: 'taf',                       environment: 'producao',       ipAddress: '172.31.34.117', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSL-TOTRPW-01P', displayName: 'OCSL-TOTRPW-01P', serverType: 'taskmanager',               environment: 'producao',       ipAddress: '172.31.32.240', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTRPW-02P', displayName: 'OCSL-TOTRPW-02P', serverType: 'taskmanager',               environment: 'producao',       ipAddress: '172.31.33.66',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTRPW-03P', displayName: 'OCSL-TOTRPW-03P', serverType: 'taskmanager',               environment: 'producao',       ipAddress: '172.31.35.114', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSL-TOTRPW-04P', displayName: 'OCSL-TOTRPW-04P', serverType: 'taskmanager',               environment: 'producao',       ipAddress: '172.31.32.209', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCVL-TOTRPW-01D', displayName: 'OCVL-TOTRPW-01D', serverType: 'taskmanager',               environment: 'producao',       ipAddress: '172.20.70.21',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCVL-TOTRPW-01H', displayName: 'OCVL-TOTRPW-01H', serverType: 'taskmanager',               environment: 'producao',       ipAddress: '172.20.67.24',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
  { hostname: 'OCSW-TOTTS-01P',  displayName: 'OCSW-TOTTS-01P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.36.250', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-02P',  displayName: 'OCSW-TOTTS-02P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.35.120', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-03P',  displayName: 'OCSW-TOTTS-03P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.32.125', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-04P',  displayName: 'OCSW-TOTTS-04P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.38.0',   domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-05P',  displayName: 'OCSW-TOTTS-05P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.37.115', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-06P',  displayName: 'OCSW-TOTTS-06P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.33.170', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-07P',  displayName: 'OCSW-TOTTS-07P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.38.9',   domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-08P',  displayName: 'OCSW-TOTTS-08P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.32.91',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-09P',  displayName: 'OCSW-TOTTS-09P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.38.109', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-10P',  displayName: 'OCSW-TOTTS-10P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.38.64',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-11P',  displayName: 'OCSW-TOTTS-11P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.37.249', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-12P',  displayName: 'OCSW-TOTTS-12P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.34.158', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TOTTS-13P',  displayName: 'OCSW-TOTTS-13P',  serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.35.75',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TS-01P',     displayName: 'OCSW-TS-01P',     serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.35.131', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TS-02P',     displayName: 'OCSW-TS-02P',     serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.34.238', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TS-03P',     displayName: 'OCSW-TS-03P',     serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.32.69',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCSW-TS-04P',     displayName: 'OCSW-TS-04P',     serverType: 'terminal-server',           environment: 'producao',       ipAddress: '172.31.35.132', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVW-TS-01D',     displayName: 'OCVW-TS-01D',     serverType: 'terminal-server',           environment: 'desenvolvimento', ipAddress: '172.20.71.1',   domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVW-TS-02D',     displayName: 'OCVW-TS-02D',     serverType: 'terminal-server',           environment: 'desenvolvimento', ipAddress: '172.20.66.112', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVW-TS-03D',     displayName: 'OCVW-TS-03D',     serverType: 'terminal-server',           environment: 'desenvolvimento', ipAddress: '172.20.71.90',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVW-TS-04D',     displayName: 'OCVW-TS-04D',     serverType: 'terminal-server',           environment: 'desenvolvimento', ipAddress: '172.20.70.38',  domain: 'unimedpoa.com.br', fqdn: null, osName: 'Windows'      },
  { hostname: 'OCVL-TOTCC-01H',  displayName: 'OCVL-TOTCC-01H',  serverType: 'totvs-command-center',      environment: 'homologacao',    ipAddress: '172.20.66.136', domain: 'unimedpoa.com.br', fqdn: null, osName: 'Oracle Linux' },
];

async function main(): Promise<void> {
  console.log('Conectando ao banco de dados...');

  // Buscar ou criar org unimedpoa
  let org = await db('organizations').where({ slug: 'unimedpoa' }).first() as { id: string } | undefined;
  if (!org) {
    console.log('Organizacao unimedpoa nao encontrada. Criando...');
    const [created] = await db('organizations').insert({
      name: 'Unimed Porto Alegre',
      slug: 'unimedpoa',
      plan: 'professional',
      is_active: true,
    }).returning('*');
    org = created as { id: string };
    console.log(`  Organizacao criada: ${org.id}`);
  } else {
    console.log(`Organizacao encontrada: ${org.id}`);
  }

  const orgId = org.id;
  let inserted = 0;
  let skipped = 0;

  for (const s of RAW_SERVERS) {
    const existing = await db('servers')
      .where({ hostname: s.hostname, organization_id: orgId })
      .whereNull('deleted_at')
      .first();

    if (existing) {
      console.log(`  SKIP (ja existe): ${s.hostname}`);
      skipped++;
      continue;
    }

    await db('servers').insert({
      organization_id: orgId,
      hostname: s.hostname,
      display_name: s.displayName,
      server_type: s.serverType,
      provider: 'oracle_cloud',
      environment: s.environment,
      status: 'active',
      private_ips: s.ipAddress ? [s.ipAddress] : [],
      domain: s.domain,
      fqdn: s.fqdn,
      os_name: s.osName,
      os_version: null,
      cpu_cores: null,
      ram_gb: null,
      owner_team: null,
      description: s.displayName,
      tags: [],
      services: JSON.stringify([]),
      metadata: JSON.stringify({}),
    });

    console.log(`  OK: ${s.hostname}`);
    inserted++;
  }

  console.log(`\nConcluido: ${inserted} inseridos, ${skipped} ignorados (ja existiam).`);
  await db.destroy();
}

main().catch((err: unknown) => {
  console.error('Erro:', err);
  void db.destroy();
  process.exit(1);
});
