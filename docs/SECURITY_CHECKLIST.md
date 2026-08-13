# Checklist de Seguranca (OWASP Top 10 2021)

Avaliacao do estado atual do back-stage frente ao OWASP Top 10, com referencia ao codigo que implementa (ou ainda nao implementa) cada controle.

| # | Categoria OWASP | Status | Implementacao |
| --- | --- | --- | --- |
| A01 | Broken Access Control | ✅ | RBAC via `authorizeMiddleware` (`shared/http/authorize.middleware.ts`) em todas as rotas de escrita/administrativas; `authenticateMiddleware` valida JWT antes de qualquer acao sensivel; testes de integracao (`app.integration.test.ts`) confirmam 401 em rotas protegidas sem token. |
| A02 | Cryptographic Failures | ✅ | Senhas com `bcryptjs` (salt rounds 10, `shared/auth/password.ts`); JWT assinado com segredo forte obrigatorio em producao (`config/env.ts` lanca erro se `JWT_SECRET` for o valor de dev); TLS/HTTPS delegado ao Ingress (`cert-manager` + `nginx.ingress.kubernetes.io/ssl-redirect`); Redis/RDS com encriptacao em transito/repouso no Terraform. |
| A03 | Injection | ✅ | 100% das queries via Knex Query Builder parametrizado (sem SQL string concatenation); unico uso de `whereRaw`/`raw` usa bind parameters (`?`), nunca interpolacao direta de input do usuario; validacao de entrada com Zod em todas as rotas (`validateMiddleware`). |
| A04 | Insecure Design | ✅ | Modular Monolith com DDD, Repository Pattern e Service Layer isolam regras de negocio de I/O; RBAC por papel (`admin`/`maintainer`/`viewer`) desenhado desde a Fase 3; exemptions de governance exigem aprovacao explicita (nunca auto-aprovadas). |
| A05 | Security Misconfiguration | ✅ | `helmet()` ativo (headers de seguranca, testado em `app.integration.test.ts`); `x-powered-by` desabilitado; CORS restrito a `CORS_ORIGIN` configuravel; containers Docker rodam como usuario nao-root (`USER` implicito via `runAsNonRoot: true` no Helm); `readOnlyRootFilesystem: true` no backend; secrets nunca hardcoded (Helm `values.yaml` documenta uso de `--set`/External Secrets). |
| A06 | Vulnerable and Outdated Components | ⚠️ | `npm audit` e Trivy (filesystem + imagem) rodam em CI (`security-scan.yml`) semanalmente e em cada PR; **51 vulnerabilidades reportadas por `npm audit` nesta arvore de dependencias** (majoritariamente transitivas de `@opentelemetry/*` e toolchain de dev/test) — nenhuma delas foi triada individualmente nesta sessao; recomenda-se `npm audit fix` + revisao antes do primeiro deploy em producao. |
| A07 | Identification and Authentication Failures | ✅ | JWT com expiracao configuravel (`JWT_EXPIRES_IN`); rate limiting global (`express-rate-limit`) mitiga brute-force em `/auth/login`; senhas nunca retornadas em respostas (DTOs explicitos, `password_hash` nunca serializado). |
| A08 | Software and Data Integrity Failures | ✅ | Webhooks GitHub/GitLab validam assinatura HMAC-SHA256 / token antes de processar qualquer payload (`shared/webhooks/signature.ts`, testado); imagens Docker com tag imutavel no ECR (`image_tag_mutability = "IMMUTABLE"`); CI usa `npm ci` (lockfile determinista). |
| A09 | Security Logging and Monitoring Failures | ✅ | Audit trail completo (`audit_logs`, `auditLogger`) para toda mutacao (create/update/delete/evaluate/exemption/deployment); logs estruturados JSON via Winston + Morgan, correlacionados por `x-request-id`; agregados via Loki/Promtail; alertas Prometheus para erro/latencia/disponibilidade (`observability/prometheus/alerts.yml`). |
| A10 | Server-Side Request Forgery (SSRF) | ✅ | Nenhum endpoint aceita URL arbitraria para fetch server-side; webhooks sao *inbound* (recebem POST, nao fazem requisicoes outbound baseadas em input do usuario). |

## Controles adicionais implementados

- **Rate limiting**: `express-rate-limit` global, configuravel via `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`.
- **Validacao de entrada**: Zod em 100% dos endpoints que recebem body/query/params.
- **Principio do menor privilegio**: containers Kubernetes com `allowPrivilegeEscalation: false`, `capabilities.drop: ["ALL"]`.
- **Secrets**: nunca commitados; Helm `Secret` template le de `values.data` (vazio por padrao) ou de secret manager externo; Terraform usa `TF_VAR_db_password` (nunca hardcoded).
- **CI/CD**: `security-scan.yml` roda `npm audit`, CodeQL (SAST) e Trivy (filesystem + imagem) em todo push/PR e semanalmente.

## Pendencias conhecidas (nao bloqueantes para esta entrega)

1. Triar e resolver as vulnerabilidades reportadas por `npm audit` (rodar `npm audit fix`, avaliar breaking changes).
2. Nao ha rotacao automatica de `JWT_SECRET`/webhook secrets — recomenda-se integrar com um secret manager (AWS Secrets Manager/External Secrets Operator) antes de producao.
3. Nao ha MFA para o login administrativo — fora do escopo das fases solicitadas.
