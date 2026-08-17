# Guia de Desenvolvimento

Guia completo para configurar o ambiente de desenvolvimento local do Back-Stage.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Setup Inicial](#setup-inicial)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Desenvolvimento Backend](#desenvolvimento-backend)
- [Desenvolvimento Frontend](#desenvolvimento-frontend)
- [Banco de Dados](#banco-de-dados)
- [Testing](#testing)
- [Debugging](#debugging)
- [Git Workflow](#git-workflow)

---

## Pré-requisitos

### Ferramentas Obrigatórias
- **Node.js 18+** (recomenda-se 20 LTS)
- **npm 9+**
- **PostgreSQL 16**
- **Git**

### Ferramentas Recomendadas
- **VSCode** com extensões:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin
  - REST Client
  - PostgreSQL Explorer
- **Insomnia** ou **Postman** para testar API
- **pgAdmin** para gerenciar banco de dados

### Instalação (Windows)

```powershell
# Node.js (via Chocolatey)
choco install nodejs postgresql

# Ou via instaladores:
# https://nodejs.org/
# https://www.postgresql.org/download/windows/

# Verificar instalação
node --version
npm --version
psql --version
```

---

## Setup Inicial

### 1. Clonar Repositório

```bash
git clone https://github.com/your-org/back-stage.git
cd back-stage
```

### 2. Instalar Dependências

```bash
npm install
```

Isso instala dependências de todos os workspaces.

### 3. Criar Arquivo `.env`

Na raiz do projeto, criar `.env` com:

```env
# Servidor
NODE_ENV=development
BACKEND_PORT=4000
FRONTEND_PORT=5173

# PostgreSQL Local
POSTGRES_USER=backstage
POSTGRES_PASSWORD=backstage
POSTGRES_DB=backstage
POSTGRES_PORT=5432
DATABASE_URL=postgres://backstage:backstage@localhost:5432/backstage

# CORS
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=1h

# Logging
LOG_LEVEL=debug
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=1000  # Aumentado para desenvolvimento

# Webhooks
GITHUB_WEBHOOK_SECRET=dev-github-secret
GITLAB_WEBHOOK_SECRET=dev-gitlab-secret
```

### 4. Configurar Banco de Dados

#### Opção A: PostgreSQL Local (Recomendado)

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar usuário (se não existir)
CREATE USER backstage WITH PASSWORD 'backstage';

# Criar banco
CREATE DATABASE backstage OWNER backstage;

# Listar bancos
\l

# Sair
\q
```

#### Opção B: Docker Compose

```bash
docker compose up -d postgres redis
```

### 5. Executar Migrations

```bash
npm run migrate --workspace=@back-stage/backend
```

### 6. Semear Dados Iniciais (Opcional)

```bash
npm run db:seed --workspace=@back-stage/backend
```

Cria:
- Usuário admin (código: `admin`, senha: `Tectrs123`)
- 3 servidores de exemplo
- 3 aplicações de exemplo

---

## Estrutura de Pastas

```
back-stage/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.ts              # Express app principal
│   │   │   ├── server.ts           # Entry point
│   │   │   ├── container.ts        # IoC container (awilix)
│   │   │   ├── config/
│   │   │   │   ├── database.ts     # Knex config
│   │   │   │   └── jwt.ts          # JWT config
│   │   │   ├── modules/            # DDD domains
│   │   │   │   ├── auth/
│   │   │   │   │   ├── domain/
│   │   │   │   │   ├── application/
│   │   │   │   │   ├── infrastructure/
│   │   │   │   │   └── interfaces/
│   │   │   │   ├── servers/
│   │   │   │   └── ...
│   │   │   ├── shared/
│   │   │   │   ├── middleware/
│   │   │   │   ├── error-handler/
│   │   │   │   └── logger/
│   │   │   └── database/
│   │   │       ├── migrations/
│   │   │       ├── seeds/
│   │   │       └── knexfile.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── index.html
│   │   │   ├── app/
│   │   │   │   ├── App.tsx
│   │   │   │   └── router.tsx
│   │   │   ├── pages/
│   │   │   ├── features/           # Lógica com hooks (TanStack Query)
│   │   │   ├── shared/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   └── api/
│   │   │   └── styles/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── e2e/                         # Testes Playwright
│
├── .env                             # Configuração local
├── .env.example                     # Template
├── docker-compose.yml               # Serviços locais
├── package.json                     # Root workspace
├── README.md                        # Documentação geral
└── DEVELOPMENT.md                  # Este arquivo
```

---

## Desenvolvimento Backend

### Iniciar Servidor

```bash
npm run dev --workspace=@back-stage/backend
```

**Resultado:**
- Backend rodando em `http://localhost:4000`
- Hot reload ativado (reinicia ao salvar arquivo)
- Logs detalhados no console

### Estrutura de um Módulo (DDD)

Exemplo: Módulo de Servidores

```
modules/servers/
├── domain/                    # Regras de negócio
│   ├── entities/
│   │   └── Server.ts         # Entidade
│   ├── repositories/
│   │   └── ServerRepository.interface.ts
│   └── services/
│       └── CreateServerService.ts
│
├── application/               # Lógica de aplicação
│   ├── dto/
│   │   ├── CreateServerDTO.ts
│   │   └── UpdateServerDTO.ts
│   └── usecases/
│       ├── CreateServerUseCase.ts
│       ├── GetServerUseCase.ts
│       └── ListServersUseCase.ts
│
├── infrastructure/            # Detalhes técnicos
│   └── ServerRepository.ts    # Implementação com Knex
│
├── interfaces/                # Camada HTTP
│   ├── http/
│   │   ├── ServerController.ts
│   │   ├── server.routes.ts
│   │   └── server.validation.ts
│   └── events/ (opcional)
│
└── servers.module.ts          # Registro do módulo
```

### Criar Nova Funcionalidade

1. **Criar migration (banco)**

```bash
npm run migrate:make --workspace=@back-stage/backend -- add_column_to_servers
```

2. **Implementar domain logic** (entities, repositories)

3. **Criar application layer** (use cases, DTOs)

4. **Implementar infrastructure** (repository com Knex)

5. **Adicionar HTTP interface** (controller, routes, validation)

6. **Registrar no módulo** (module.ts)

### TypeScript Strict Mode

```bash
npm run typecheck --workspace=@back-stage/backend
```

Requer:
- Tipos explícitos em parâmetros/retorno
- Sem `any`
- Sem null implícito

---

## Desenvolvimento Frontend

### Iniciar Dev Server

```bash
npm run dev --workspace=@back-stage/frontend
```

**Resultado:**
- Frontend rodando em `http://localhost:5173`
- Vite Hot Module Replacement (HMR)
- Logs de build no console

### Estrutura de Páginas

```
pages/
├── ServersPage.tsx              # Listagem
├── ServerDetailPage.tsx         # Detalhes + drill-down
├── ApplicationsPage.tsx
├── DatabasesPage.tsx
├── UrlsPage.tsx
└── EcosystemPage.tsx            # Grafo completo
```

### Estrutura de Features

Features contêm lógica de negócio isolada com hooks:

```
features/servers/
├── use-server.ts               # Hook: GET /api/servers/:id
├── use-servers.ts              # Hook: GET /api/servers (com paginação)
├── use-create-server.ts        # Hook: POST /api/servers (mutation)
└── use-delete-server.ts        # Hook: DELETE /api/servers/:id
```

**Exemplo Hook:**

```typescript
// features/servers/use-servers.ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client';

export function useServers(filters = {}) {
  return useQuery({
    queryKey: ['servers', filters],
    queryFn: async () => {
      return apiRequest('/api/servers', { method: 'GET' });
    },
  });
}

// Usar na página
const { data, isLoading, isError } = useServers();
```

### Criar Nova Página

1. **Criar arquivo** `pages/MyPage.tsx`

2. **Implementar página**

```typescript
import { useState } from 'react';
import { useMyResource } from '../features/my-feature/use-my-resource';
import { PageHeader } from '../shared/components/PageHeader';

export function MyPage() {
  const { data, isLoading, isError } = useMyResource();
  
  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage message="Erro ao carregar" />;
  
  return (
    <div className="space-y-6">
      <PageHeader title="Meu Recurso" description="Descrição" />
      {/* Conteúdo aqui */}
    </div>
  );
}
```

3. **Adicionar rota** em `app/router.tsx`

```typescript
import { MyPage } from '../pages/MyPage';

const routes = [
  // ...
  { path: '/my-resource', element: <MyPage /> },
];
```

4. **Adicionar menu** em `layouts/AppLayout.tsx`

---

## Banco de Dados

### Criar Migration

```bash
npm run migrate:make --workspace=@back-stage/backend -- create_new_table
```

Abre editor com template:

```typescript
// migrations/20260816123456_create_new_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('my_table', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('my_table');
}
```

### Executar Migrations

```bash
# Executar todas pendentes
npm run migrate --workspace=@back-stage/backend

# Desfazer última
npm run migrate:down --workspace=@back-stage/backend

# Resetar (cuidado!)
npm run migrate:reset --workspace=@back-stage/backend
```

### Consultar Banco

```bash
# Conectar
psql -U backstage -d backstage

# Listar tabelas
\dt

# Descrever tabela
\d servers

# Executar query
SELECT * FROM servers LIMIT 5;

# Sair
\q
```

---

## Testing

### Testes Unitários (Vitest)

```bash
npm run test --workspace=@back-stage/backend

# Watch mode
npm run test:watch --workspace=@back-stage/backend

# Coverage
npm run test:coverage --workspace=@back-stage/backend
```

**Exemplo teste:**

```typescript
// __tests__/CreateServerUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { CreateServerUseCase } from '../CreateServerUseCase';

describe('CreateServerUseCase', () => {
  it('deve criar servidor com dados válidos', async () => {
    const useCase = new CreateServerUseCase(serverRepository);
    const result = await useCase.execute({
      hostname: 'web-01',
      displayName: 'Web Server 1',
    });
    
    expect(result.id).toBeDefined();
    expect(result.hostname).toBe('web-01');
  });
});
```

### Testes E2E (Playwright)

```bash
npm run test:e2e --workspace=@back-stage/e2e

# UI mode
npm run test:e2e:ui --workspace=@back-stage/e2e

# Debug mode
npm run test:e2e:debug --workspace=@back-stage/e2e
```

---

## Debugging

### Backend

**VSCode Debugger:**

1. Adicionar breakpoint (F9)
2. Executar: `npm run dev --workspace=@back-stage/backend`
3. Abrir DevTools: `chrome://inspect`

**Logs estruturados:**

```typescript
import logger from '../shared/logger';

logger.info('Iniciando servidor', { port: 4000 });
logger.error('Erro ao buscar servidor', { serverId, error });
logger.debug('Query executada', { sql, duration: '125ms' });
```

### Frontend

**React DevTools:**
- Instalar extensão Chrome
- Inspecionar componentes
- Ver props e estado

**React Query DevTools:**
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Console do Browser:**
- F12
- Abrir Console tab
- Ver logs e erros

---

## Git Workflow

### Criar Feature

```bash
# 1. Atualizar main
git checkout main
git pull origin main

# 2. Criar branch
git checkout -b feature/meu-recurso

# 3. Fazer commits
git add packages/backend/src/modules/servers/...
git commit -m "feat: adiciona listagem de servidores"

git add packages/frontend/src/pages/...
git commit -m "feat: cria página ServersPage"

# 4. Push
git push origin feature/meu-recurso

# 5. Abrir PR no GitHub
```

### Commits Semânticos

```
feat:      nova funcionalidade
fix:       correção de bug
docs:      documentação
refactor:  refatoração sem mudança de comportamento
test:      adiciona/atualiza testes
chore:     atualização de dependências
style:     formatação de código
perf:      melhoria de performance
```

### Review

```bash
# Antes de fazer PR, verificar:

# Type checking
npm run typecheck

# Linting
npm run lint

# Testes
npm run test

# Build
npm run build
```

---

## 🆘 Problemas Comuns

### Erro: "Cannot find module '@back-stage/backend'"

```bash
# Reinstalar dependencies
rm -rf node_modules package-lock.json
npm install
```

### Erro: "ENOENT: no such file or directory, open '.env'"

```bash
# Criar .env na raiz
cp .env.example .env
# Editar com suas variáveis
```

### Erro: "connect ECONNREFUSED 127.0.0.1:5432"

```bash
# Verificar PostgreSQL
psql -U postgres
# Se não conectar, iniciar serviço

# Windows
net start PostgreSQL-x64-16

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

### Frontend não conecta com backend

```
Verificar:
1. Backend rodando: http://localhost:4000/health
2. CORS_ORIGIN correto no .env
3. URL da API em src/shared/api/http-client.ts
4. Console do browser para ver erro CORS
```

---

## 📚 Recursos Úteis

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Knex.js Query Builder](http://knexjs.org/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Última atualização**: Agosto 2026
