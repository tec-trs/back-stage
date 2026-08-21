# Database Backups

Este diretório contém backups do banco de dados PostgreSQL da aplicação Back-Stage.

## Restaurar um Backup

Para restaurar um backup do banco:

```bash
PGPASSWORD=backstage psql -U backstage -h localhost -d backstage < backstage_backup.sql
```

## Criar Novo Backup

Para criar um novo backup:

```bash
PGPASSWORD=backstage pg_dump -U backstage -h localhost -d backstage > backups/backstage_$(date +%Y%m%d_%H%M%S).sql
```

## Arquivos

- `backstage_backup.sql` - Backup mais recente do banco de dados

**Data do backup:** 2026-08-21 19:34 UTC
**Versão da app:** 2.0.0
