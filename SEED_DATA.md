# Geração de Dados de Teste

Este documento descreve como gerar dados aleatórios para testar o Back-Stage CMDB.

## Pré-requisitos

- Backend rodando em `http://localhost:3000`
- Node.js com ts-node instalado
- npm dependencies instaladas

## Como Executar

### Opção 1: Com npm script (recomendado)

```bash
cd packages/backend
npm run seed:data
```

### Opção 2: Diretamente com ts-node

```bash
cd packages/backend
npx ts-node ../../scripts/seed-data.ts
```

### Opção 3: Com variáveis de ambiente customizadas

```bash
API_URL=http://localhost:3000/api npx ts-node scripts/seed-data.ts
```

## O que será gerado

O script gera:

- **8 Servidores** com tipos variados (VM, Bare Metal, Container Host)
- **6 Bancos de Dados** com engines diferentes (PostgreSQL, MySQL, Redis, MongoDB)
- **10 Aplicações** com frameworks variados (Node.js, Django, Spring, .NET)
- **Múltiplos Relacionamentos** entre aplicações, bancos e servidores

## Dados Aleatórios

O script cria dados realistas incluindo:

- Ambientes: production, staging, development, sandbox
- Criticidades: low, medium, high, critical
- Status: active, maintenance, provisioning, deprecated, deactivated
- IPs aleatórios na faixa 10.x.x.x
- Nomes descritivos para cada recurso
- Relacionamentos entre componentes

## Resultado

Após a execução, você poderá:

1. **Visualizar os dados** em cada página:
   - `/servers` - Lista de servidores
   - `/databases` - Lista de bancos de dados
   - `/applications` - Lista de aplicações

2. **Ver o mapa de dependências** em:
   - `/ecosystem` - Mapa visual de todas as dependências
   - `/architecture-diagram` - Diagrama de arquitetura

3. **Testar funcionalidades**:
   - Importação/Exportação CSV
   - Edição e duplicação de registros
   - Visualização de relacionamentos
   - Análise de impacto

## Limpeza

Para remover todos os dados gerados, você pode:

1. Deletar registros via UI
2. Resetar o banco de dados
3. Executar o script novamente (pode gerar duplicatas com nomes ligeiramente diferentes)

## Troubleshooting

**Erro: "Cannot find module 'axios'"**
```bash
npm install axios --save-dev
```

**Erro: "API_URL not found"**
Certifique-se de que o backend está rodando em `http://localhost:3000`

**Erro: "Duplicate entry"**
O script tenta evitar duplicatas, mas se encontrar nomes duplicados, pule com um aviso.
