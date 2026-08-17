# Back-Stage - CMDB (Configuration Management Database)

Sistema completo de **Gerenciamento de Configuração** (CMDB) para documentar e gerenciar a infraestrutura de TI, incluindo servidores, aplicações, bancos de dados, URLs e suas dependências complexas.

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API](#-api)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

Back-Stage é uma plataforma inspirada no **Backstage / Spotify Portal Engineering** que oferece uma interface unificada para:

- 📊 **Documentar recursos** de TI: Servidores, aplicações, bancos de dados e URLs
- 🔗 **Mapear dependências**: Visualizar relacionamentos complexos entre recursos
- 📈 **Análise de impacto**: Simular parada de recursos e calcular "blast radius"
- 🔍 **Busca global**: Encontrar recursos por nome, tipo ou tags
- 📊 **Visualização gráfica**: Grafo interativo de dependências com Dagre layout
- 🔐 **Autenticação JWT**: Controle de acesso baseado em roles (RBAC)

---

## ✨ Funcionalidades

### Servidores
- ✅ Cadastro completo de servidores físicos/virtuais
- ✅ Documentar recursos (CPU, RAM, SO, discos)
- ✅ Configurar networking (IPs privados/públicos, domínios)
- ✅ Associar aplicações hospedadas
- ✅ Tags para categorização e filtros
- ✅ Drill-down para dependências

### Aplicações
- ✅ Cadastro com tipo e ambiente
- ✅ Mapeamento automático de dependências entre aplicações
- ✅ Rastrear servidores onde é hospedada
- ✅ Documentar dados de backup e replicação
- ✅ Integração com outros recursos

### Bancos de Dados
- ✅ Suporte para múltiplos engines: PostgreSQL, MySQL, MongoDB, Redis, Oracle, etc
- ✅ Documentar conexão, porta e versão
- ✅ Políticas de backup e replicação
- ✅ Criticidade e SLA
- ✅ Análise de impacto quando um banco cai

### URLs e Endpoints
- ✅ Documentar URLs, APIs e webhooks
- ✅ Configurar autenticação e healthcheck
- ✅ Monitoramento e status
- ✅ Associar a recurso responsável (servidor, aplicação ou banco)

### Grafo de Dependências
- ✅ Visualização interativa com React Flow
- ✅ Layout automático com Dagre
- ✅ Drill-down entre níveis
- ✅ Simulação de parada (blast radius)
- ✅ Análise de impacto transitiva
- ✅ Detecção de ciclos

### Busca Global
- ✅ Full-text search com PostgreSQL tsvector
- ✅ Filtro por tags (com índices GIN)
- ✅ Navegação rápida entre recursos
- ✅ Suporte a 5+ tipos de recursos

---

## 🏗️ Arquitetura

### Stack Tecnológico

**Backend**
```
Node.js 18+ → Express 4.x → TypeScript → Knex 3.x → PostgreSQL 16
JWT Auth → Zod Validation → DDD Pattern → Repository Pattern
```

**Frontend**
```
React 19 → Vite → TypeScript → TailwindCSS
React Flow + Dagre → TanStack Query v5 → React Router
```

**Infraestrutura**
```
npm Workspaces (monorepo)
PostgreSQL 16 (banco de dados)
Redis (cache, opcional)
Kafka (message queue, opcional)
```

### Padrões de Arquitetura

**Backend**
- **DDD** (Domain-Driven Design) com módulos por domínio
- **Repository Pattern** para acesso a dados
- **Soft Delete** com timestamps (deleted_at)
- **Polymorphic Foreign Keys** para grafo genérico
- **CTE Recursivas** para travessia de grafo

**Frontend**
- **Component-Based** com React
- **Custom Hooks** para lógica
- **TanStack Query** para cache e sincronização
- **Controlled Components** com estado

---

## 🚀 Configuração

### Pré-requisitos

| Ferramenta | Versão Mínima |
|------------|--------------|
| Node.js    | 18+          |
| npm        | 9+           |
| PostgreSQL | 16           |

### 1. Clonar e Instalar

```bash
git clone <repository-url>
cd back-stage
npm install
```

### 2. Configurar `.env`

```env
# Servidor
NODE_ENV=development
BACKEND_PORT=4000
FRONTEND_PORT=5173

# Banco de Dados
POSTGRES_USER=backstage
POSTGRES_PASSWORD=backstage
POSTGRES_DB=backstage
POSTGRES_PORT=5432
DATABASE_URL=postgres://backstage:backstage@localhost:5432/backstage

# CORS
CORS_ORIGIN=http://localhost:5173

# Autenticação
JWT_SECRET=seu-secret-seguro-aqui-mudar-em-producao
JWT_EXPIRES_IN=1h

# Logging
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Webhooks (opcional)
GITHUB_WEBHOOK_SECRET=seu-secret-do-github
GITLAB_WEBHOOK_SECRET=seu-secret-do-gitlab
```

### 3. Banco de Dados

```bash
# Executar migrations
npm run migrate --workspace=@back-stage/backend

# Semear dados iniciais (opcional)
npm run db:seed --workspace=@back-stage/backend
```

### 4. Iniciar Aplicação

```bash
# Terminal 1 - Backend
npm run dev --workspace=@back-stage/backend
# Backend em http://localhost:4000

# Terminal 2 - Frontend
npm run dev --workspace=@back-stage/frontend
# Frontend em http://localhost:5173
```

**Credenciais de teste:**
- Usuário: `admin`
- Senha: `Tectrs123`

---

## 📁 Estrutura do Projeto

```
back-stage/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.ts                      # Express app
│   │   │   ├── modules/
│   │   │   │   ├── auth/                   # Login, JWT
│   │   │   │   ├── servers/                # Servidores
│   │   │   │   ├── applications/           # Aplicações
│   │   │   │   ├── databases/              # Bancos de dados
│   │   │   │   ├── urls/                   # URLs e endpoints
│   │   │   │   ├── resource-graph/         # Grafo e impacto
│   │   │   │   └── search/                 # Busca global
│   │   │   └── database/
│   │   │       ├── migrations/             # Knex migrations
│   │   │       └── knexfile.ts             # Configuração Knex
│   │   ├── knexfile.ts                     # Entry migrations
│   │   └── package.json
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx                    # Entry point
│   │   │   ├── app/
│   │   │   │   └── router.tsx              # Rotas
│   │   │   ├── pages/
│   │   │   │   ├── ServersPage.tsx
│   │   │   │   ├── ServersDetailPage.tsx
│   │   │   │   ├── ApplicationsPage.tsx
│   │   │   │   ├── DatabasesPage.tsx
│   │   │   │   ├── UrlsPage.tsx
│   │   │   │   └── EcosystemPage.tsx       # Grafo completo
│   │   │   ├── features/                   # Hooks (TanStack Query)
│   │   │   ├── shared/
│   │   │   │   ├── components/
│   │   │   │   │   ├── ResourceGraph.tsx   # Visualizador grafo
│   │   │   │   │   ├── CreateDatabaseModal.tsx
│   │   │   │   │   └── CreateUrlModal.tsx
│   │   │   │   └── api/
│   │   │   └── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── e2e/                                # Testes Playwright
│
├── .env                                    # Variáveis ambiente
├── docker-compose.yml                      # PostgreSQL + Redis
├── package.json                            # Root workspace
└── README.md                               # Este arquivo
```

---

## 🔌 API Endpoints

### Autenticação
```
POST /api/auth/login
  Body: { code: string, password: string }
  Response: { token: string, user: User }
```

### Servidores
```
GET    /api/servers                 # Listar (paginado)
GET    /api/servers/:id             # Detalhes
POST   /api/servers                 # Criar
PUT    /api/servers/:id             # Atualizar
DELETE /api/servers/:id             # Deletar
```

### Aplicações
```
GET    /api/applications            # Listar
GET    /api/applications/:id        # Detalhes
POST   /api/applications            # Criar
PUT    /api/applications/:id        # Atualizar
DELETE /api/applications/:id        # Deletar
```

### Bancos de Dados
```
GET    /api/databases               # Listar
GET    /api/databases/:id           # Detalhes
POST   /api/databases               # Criar
PUT    /api/databases/:id           # Atualizar
DELETE /api/databases/:id           # Deletar
```

### URLs
```
GET    /api/urls                    # Listar
GET    /api/urls/:id                # Detalhes
POST   /api/urls                    # Criar
PUT    /api/urls/:id                # Atualizar
DELETE /api/urls/:id                # Deletar
```

### Grafo de Recursos
```
GET    /api/resource-graph                      # Grafo completo
GET    /api/resource-graph/:type/:id/subgraph?depth=2
       # Subgrafo de um recurso com profundidade

POST   /api/resource-graph/simulate-impact
  Body: { resourceType: string, resourceId: string }
  Response: {
    impactedResources: Resource[],
    totalImpacted: number,
    byType: { [type]: count }
  }
```

### Busca
```
GET    /api/search
  Query: ?q=termo&tags=tag1,tag2&type=server&page=1&pageSize=20
  Response: {
    items: SearchResult[],
    pagination: { page, pageSize, total }
  }
```

---

## 🗄️ Modelo de Dados

### Servidor
```typescript
{
  id: string;
  hostname: string;
  displayName: string;
  description?: string;
  serverType: string;
  provider: string;                // aws, azure, gcp, on_premises
  environment: string;              // production, staging, development
  status: string;                   // active, maintenance, deactivated
  cpuCores: number;
  ramGb: number;
  osName: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Banco de Dados
```typescript
{
  id: string;
  name: string;
  displayName: string;
  engine: string;                   // postgres, mysql, mongodb, redis, oracle
  version?: string;
  port?: number;
  environment: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  hasBackup: boolean;
  backupPolicy?: string;
  lastBackupAt?: Date;
  tags: string[];
  createdAt: Date;
}
```

### Relacionamento (Polimórfico)
```typescript
{
  id: string;
  sourceType: 'server' | 'application' | 'database' | 'url';
  sourceId: string;
  targetType: 'server' | 'application' | 'database' | 'url';
  targetId: string;
  relationType: 'hosts' | 'depends_on' | 'connects_to' | 'exposes' | 'consumes';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

---

## 📊 Tipos de Relacionamentos

| Relação | Significado |
|---------|------------|
| **hosts** | Servidor hospeda aplicação |
| **depends_on** | Aplicação depende de outra aplicação |
| **connects_to** | Aplicação conecta ao banco de dados |
| **exposes** | Servidor/App expõe URL/API |
| **consumes** | Aplicação consome serviço externo |

---

## 🛠️ Scripts

```bash
# Backend
npm run dev --workspace=@back-stage/backend       # Dev com hot reload
npm run build --workspace=@back-stage/backend     # Build production
npm run typecheck --workspace=@back-stage/backend # Type checking
npm run migrate --workspace=@back-stage/backend   # Executar migrations

# Frontend
npm run dev --workspace=@back-stage/frontend      # Dev com hot reload
npm run build --workspace=@back-stage/frontend    # Build production
npm run typecheck --workspace=@back-stage/frontend# Type checking

# Qualidade de código
npm run lint                                      # ESLint
npm run test                                      # Testes unitários
npm run test:e2e --workspace=@back-stage/e2e     # Testes e2e
```

---

## 🔐 Autenticação

**Tipo**: JWT (JSON Web Tokens)
- **Expiração**: 1 hora
- **Storage**: localStorage no navegador
- **Header**: `Authorization: Bearer <token>`

**Roles (RBAC)**
- `admin` - Acesso total
- `maintainer` - Criar/editar recursos
- `viewer` - Apenas visualização

---

## 🎨 Frontend - Componentes

**Pages**
- `ServersPage` / `ServerDetailPage`
- `ApplicationsPage` / `ApplicationDetailPage`
- `DatabasesPage` / `DatabaseDetailPage`
- `UrlsPage` / `UrlDetailPage`
- `EcosystemPage` (grafo completo)

**Componentes Reutilizáveis**
- `ResourceGraph` - Visualizador interativo de grafo
- `Badge` - Status badges com temas
- `Button` - Botões estilizados
- `CreateDatabaseModal` - Modal para criar banco
- `CreateUrlModal` - Modal para criar URL

**Tema**
- Tailwind CSS com tema escuro (slate)
- Modo claro: não suportado atualmente
- Cores: Blue (primary), Green (success), Amber (warning), Red (danger)

---

## 🚨 Troubleshooting

### Porta já em uso
```bash
# Matar processo (Linux/Mac)
lsof -ti :4000 | xargs kill -9  # Backend
lsof -ti :5173 | xargs kill -9  # Frontend

# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Banco de dados recusou conexão
```bash
# Testar conexão
psql -h localhost -U backstage -d backstage

# Verificar encoding
psql -h localhost -U backstage -d backstage -c "SHOW server_encoding;"

# Resetar banco (CUIDADO - deleta dados!)
npm run migrate:reset --workspace=@back-stage/backend
```

### Caracteres corrompidos (ã, ç, é)
1. Verificar encoding UTF-8 do banco
2. Limpar cache do browser: F12 → Application → Storage → Clear All
3. Hard refresh: Ctrl+Shift+R

### Build falha com TypeScript
```bash
# Verificar erros
npm run typecheck --workspace=@back-stage/frontend

# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Convenções de Código

- **TypeScript**: Strict mode ativado
- **Componentes**: PascalCase (ex: `DatabaseDetailPage`)
- **Funções**: camelCase (ex: `handleCreateDatabase`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `MAX_PAGE_SIZE`)
- **Commits**: Prefixo type: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature: `git checkout -b feature/minha-feature`
3. Commit com mensagem descritiva: `git commit -m 'feat: adiciona nova feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

Proprietary - Tectrs

---

## 👥 Suporte

Para dúvidas, problemas ou sugestões, contate o time de Infraestrutura/Platform Engineering.

**Documentação atualizada**: Agosto 2026  
**Versão do projeto**: 1.0.0  
**Status**: ✅ Production Ready
