# Production Deployment Runbook — CMDB Unificado

**Version**: 1.0.0
**Date**: 2026-08-16
**Risk Level**: 🟡 MEDIUM
**Estimated Duration**: 1.5-2.5 hours
**Rollback Duration**: < 30 minutes

---

## ⏰ Pre-Deployment Timeline

```
T-24h: Staging validation complete, sign-off received
T-6h:  Production deployment scheduled, team notified
T-2h:  Last-minute sanity checks, alerts configured
T-0h:  Deployment begins
T+2h:  Monitoring period complete, ready for rollback
T+4h:  Post-deployment validation, feature enabled for users
```

---

## 👥 Required Team

| Role | Name | Duty |
|------|------|------|
| **Deployment Lead** | TBD | Orchestrates entire process |
| **Backend DevOps** | TBD | Handles backend/database |
| **Frontend DevOps** | TBD | Handles frontend/CDN |
| **DBA** | TBD | Monitors database performance |
| **On-Call SRE** | TBD | Monitors production metrics |

---

## ✅ Pre-Deployment Checklist (T-6h)

- [ ] Staging validation PASSED
- [ ] All approvals in place (code review, design, security)
- [ ] Backup strategy confirmed
- [ ] Rollback procedure tested
- [ ] Monitoring alerts configured
- [ ] Incident commander on-call
- [ ] Team Slack channel created (#cmdb-prod-deployment)
- [ ] Customer communications drafted

---

## 🗂️ Deployment Stages

### Stage 1: Database Migrations (T+0:00 → T+0:15)

**Purpose**: Apply new schema changes
**Risk**: High (data-affecting)
**Rollback**: Restore from backup (< 30min)

```bash
# Step 1.1: SSH to production database server
ssh proddb-primary-01

# Step 1.2: Create backup (CRITICAL)
pg_dump -h localhost -U backstage -d backstage -F c \
  > /backups/backstage-pre-cmdb-$(date +%s).dump
# Verify size > 100MB (production-sized)

# Step 1.3: Check current migration status
npm run db:migrate:status --workspace=@back-stage/backend
# Should show all migrations to 20260101000034

# Step 1.4: Apply migrations
npm run db:migrate --workspace=@back-stage/backend

# Step 1.5: Verify
npm run db:migrate:status --workspace=@back-stage/backend
# Expected: All migrations 20260101000027 → 20260101000038 marked as "completed"

# Step 1.6: Quick data integrity check
psql -h localhost -U backstage -d backstage << EOF
SELECT 'databases' as table_name, COUNT(*) as row_count FROM databases
UNION ALL
SELECT 'urls', COUNT(*) FROM urls
UNION ALL
SELECT 'resource_relationships', COUNT(*) FROM resource_relationships
UNION ALL
SELECT 'servers', COUNT(*) FROM servers;
-- Expected: All row counts > 0 or = 0 (empty tables OK)
EOF
```

**Checkpoints**:
- [ ] Backup file > 100MB
- [ ] All 12 migrations completed
- [ ] SELECT returns results (no connection errors)
- [ ] No error logs in Cloudwatch

**Rollback** (if any failure):
```bash
# Drop problematic tables
psql -h localhost -U backstage -d backstage << EOF
DROP TABLE IF EXISTS resource_relationships CASCADE;
DROP TABLE IF EXISTS urls CASCADE;
DROP TABLE IF EXISTS url_types CASCADE;
DROP TABLE IF EXISTS databases CASCADE;
DROP TABLE IF EXISTS database_engines CASCADE;
EOF

# Restore from backup
pg_restore -h localhost -U backstage -d backstage /backups/backstage-pre-cmdb-*.dump
```

---

### Stage 2: Backend Deployment (T+0:15 → T+0:45)

**Purpose**: Deploy new backend code
**Risk**: Medium (API downtime possible)
**Rollback**: Revert Docker image tag

```bash
# Step 2.1: SSH to backend servers
ssh prodapp-backend-01
ssh prodapp-backend-02
ssh prodapp-backend-03

# Step 2.2: Build Docker image (on CI/CD)
# (Docker image already built and pushed to ECR during prior steps)
docker pull 123456789.dkr.ecr.us-east-1.amazonaws.com/backstage-backend:v1.0.0-cmdb

# Step 2.3: Update service with rolling deployment
aws ecs update-service \
  --cluster backstage-prod \
  --service backstage-backend \
  --force-new-deployment \
  --image 123456789.dkr.ecr.us-east-1.amazonaws.com/backstage-backend:v1.0.0-cmdb

# Step 2.4: Monitor rollout
aws ecs describe-services \
  --cluster backstage-prod \
  --services backstage-backend | jq '.services[0].deployments'
# Expected: new deployment goes from 0 → 25% → 50% → 75% → 100% (over ~5min)

# Step 2.5: Health check new containers
for i in {1..3}; do
  echo "Backend-0$i health:"
  curl -s http://prodapp-backend-0$i:4000/api/health | jq '.status'
  # Expected: "ok"
done

# Step 2.6: Verify endpoints responding
curl -s https://api.prod.example.com/api/health | jq '.'
# Expected: 200 OK, status: "ok"

curl -s https://api.prod.example.com/api/databases \
  -H "Authorization: Bearer $PROD_TOKEN" | jq '.pagination.total'
# Expected: > 0 or 0 (no error)

curl -s "https://api.prod.example.com/api/search/unified-search?q=prod" \
  -H "Authorization: Bearer $PROD_TOKEN" | jq '.items | length'
# Expected: > 0 or 0 (no error)
```

**Checkpoints**:
- [ ] Docker image pulled successfully
- [ ] ECS deployment rolling without errors
- [ ] All 3 containers healthy
- [ ] /api/health returns 200
- [ ] New endpoints (/databases, /search/unified-search) respond
- [ ] No 5xx errors in last 5 min

**Monitoring During Rollout**:
- Watch `http_request_duration_seconds` (should stay < 200ms p95)
- Watch `http_requests_total` by status (should be 2xx > 99%)
- Watch database connection pool (should stay < 80%)

**Rollback** (if errors):
```bash
aws ecs update-service \
  --cluster backstage-prod \
  --service backstage-backend \
  --force-new-deployment \
  --image 123456789.dkr.ecr.us-east-1.amazonaws.com/backstage-backend:v0.9.9
  # (previous stable version)
```

---

### Stage 3: Frontend Deployment (T+0:45 → T+1:15)

**Purpose**: Deploy new React UI
**Risk**: Low (can rollback instantly)
**Rollback**: Revert S3 files and CloudFront cache

```bash
# Step 3.1: Build frontend (already done in CI)
npm run build --workspace=@back-stage/frontend

# Step 3.2: Upload to S3 staging bucket
aws s3 sync packages/frontend/dist s3://backstage-prod-ui-staging/ --delete

# Step 3.3: Smoke test staging bucket
curl -s https://backstage-prod-ui-staging.s3.amazonaws.com/index.html | grep -i "React\|main"
# Expected: HTML content (> 1KB)

# Step 3.4: Point production S3 to new version
aws s3 sync s3://backstage-prod-ui-staging/ s3://backstage-prod-ui/ --delete

# Step 3.5: Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123ABC456 \
  --paths "/*"

# Step 3.6: Monitor cache invalidation
aws cloudfront get-invalidation \
  --id E123ABC456 \
  --id <INVALIDATION-ID> | jq '.Invalidation.Status'
# Expected: "Completed" (within 1-2 min)

# Step 3.7: Verify production frontend
curl -s https://backstage.prod.example.com/ | grep -i "GlobalSearch\|Global Search"
# Expected: GlobalSearch component in HTML

# Step 3.8: Test in browser (manual)
# Open https://backstage.prod.example.com
# Expected: Page loads, topbar shows GlobalSearch input
```

**Checkpoints**:
- [ ] Frontend build successful (no errors)
- [ ] S3 upload complete (all files present)
- [ ] CloudFront invalidation completed
- [ ] HTML loads with GlobalSearch component
- [ ] No 404s on assets in browser console

**Monitoring**:
- Watch CloudFront request latency (should stay < 500ms)
- Watch S3 request rate
- Watch browser page load time (< 3s)

**Rollback** (instant):
```bash
# If critical issue:
# 1. Revert S3 to previous version
aws s3 sync s3://backstage-prod-ui-backup/ s3://backstage-prod-ui/ --delete

# 2. Invalidate CloudFront again
aws cloudfront create-invalidation --distribution-id E123ABC456 --paths "/*"
```

---

### Stage 4: Post-Deployment Validation (T+1:15 → T+1:45)

**Purpose**: Verify feature works end-to-end
**Risk**: Low (no write operations)

```bash
# Step 4.1: API endpoint tests
echo "Testing API endpoints..."
curl -s https://api.prod.example.com/api/databases \
  -H "Authorization: Bearer $PROD_TOKEN" | jq '.pagination.total'

curl -s "https://api.prod.example.com/api/search/unified-search?q=api" \
  -H "Authorization: Bearer $PROD_TOKEN" | jq '.items | length'

# Step 4.2: Database query test
ssh proddb-primary-01 "psql -U backstage -d backstage << EOF
SELECT COUNT(*) FROM resource_relationships;
SELECT COUNT(*) FROM databases;
SELECT COUNT(*) FROM urls;
EOF
"

# Step 4.3: Full-text search test
ssh proddb-primary-01 "psql -U backstage -d backstage << EOF
SELECT COUNT(*) FROM (
  SELECT id FROM servers WHERE search_vector @@ to_tsquery('portuguese', 'prod:*')
  UNION ALL
  SELECT id FROM applications WHERE search_vector @@ to_tsquery('portuguese', 'prod:*')
) results;
EOF
"

# Step 4.4: Monitoring dashboard check
# Open Grafana: https://monitoring.prod.example.com/d/api-health
# Expected:
#   - API latency p95 < 200ms
#   - Error rate < 0.1%
#   - DB connections < 80% max
#   - No spike in logs

# Step 4.5: Manual UI test
# 1. Open https://backstage.prod.example.com
# 2. Type "prod" in GlobalSearch
# 3. Verify results appear
# 4. Navigate to /databases
# 5. Verify database list loads
# 6. Click on a database → verify detail page
# 7. Click "Simular Impacto" → verify impact calculation
```

**Checkpoints**:
- [ ] /api/databases responds with data
- [ ] /api/search/unified-search finds results
- [ ] Full-text search < 50ms
- [ ] Database counts match expectations
- [ ] Grafana shows healthy metrics
- [ ] UI responsive and functional

---

## 🚨 Monitoring (T+1:45 → T+4:00)

**Purpose**: Catch issues in first 2 hours post-deployment
**Alerts**: Should be configured in Prometheus/PagerDuty

```
ALERT: http_requests_total{status=~"5.."}
  IF: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  THEN: Page on-call engineer

ALERT: http_request_duration_seconds
  IF: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
  THEN: Page on-call engineer

ALERT: postgres_up
  IF: postgres_up == 0
  THEN: Page DBA immediately

ALERT: resource_relationships_row_count
  IF: pg_class.reltuples['resource_relationships'] == 0
  THEN: Page DBA immediately (data loss)
```

**Manual Checks** (every 15 min for first 2 hours):

```bash
# Check 1: Error rate
curl -s https://prometheus.prod/api/v1/query \
  ?query=rate(http_requests_total{status=~"5.."}[5m]) | jq '.data.result[0].value[1]'
# Expected: < 0.01 (< 1%)

# Check 2: API latency
curl -s https://prometheus.prod/api/v1/query \
  ?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m])) \
  | jq '.data.result[0].value[1]'
# Expected: < 0.2 (< 200ms)

# Check 3: Database pool
curl -s https://prometheus.prod/api/v1/query \
  ?query=mysql_global_status_threads_connected | jq '.data.result[0].value[1]'
# Expected: < 80 (80% of max_connections)

# Check 4: Application logs
kubectl logs -n backstage deployment/backstage-backend --tail=100 | grep -i "error\|exception\|fatal"
# Expected: No critical errors
```

---

## ✅ Post-Deployment Sign-Off

After all 4 stages complete and monitoring shows healthy:

- [ ] Database migrations verified
- [ ] Backend endpoints responding
- [ ] Frontend loads without errors
- [ ] Monitoring shows < 1% error rate
- [ ] API latency p95 < 200ms
- [ ] No pagerduty alerts triggered
- [ ] Team notified of successful deployment
- [ ] Documentation updated with production URLs

**Deployment Completed**: ___________
**Deployed Version**: 1.0.0
**Next Maintenance**: TBD

---

## 🆘 Emergency Rollback

If **any** critical issue (data loss, widespread crashes, security):

```bash
# 1. Page incident commander and team
# Send: @here CRITICAL - CMDB feature rollback initiated

# 2. Rollback backend to previous version
aws ecs update-service \
  --cluster backstage-prod \
  --service backstage-backend \
  --force-new-deployment \
  --image 123456789.dkr.ecr.us-east-1.amazonaws.com/backstage-backend:v0.9.9

# 3. Rollback frontend
aws s3 sync s3://backstage-prod-ui-backup/ s3://backstage-prod-ui/ --delete
aws cloudfront create-invalidation --distribution-id E123ABC456 --paths "/*"

# 4. Rollback database (if data corruption)
# Contact DBA:
ssh proddb-primary-01 "pg_restore -h localhost -U backstage -d backstage /backups/backstage-pre-cmdb-*.dump"

# 5. Verify rollback
curl -s https://api.prod.example.com/api/health | jq '.status'
# Expected: "ok" (old version)

# 6. Post-mortem
# Create incident in Jira, schedule RCA within 24h
```

**Rollback Success Criteria**:
- [ ] Previous version running without errors
- [ ] Error rate returns to < 0.1%
- [ ] Latency returns to baseline
- [ ] No data loss (if restored from backup)

---

## 📞 Escalation Path

| Issue | First Responder | Escalate To | Timeline |
|-------|-----------------|-------------|----------|
| API 5xx errors | On-call SRE | Backend Team Lead | 5 min |
| Database errors | On-call SRE | DBA | 5 min |
| Frontend not loading | Frontend DevOps | Frontend Team Lead | 5 min |
| Performance degradation | On-call SRE | DevOps Lead | 10 min |
| Data corruption | DBA | Database Architect | Immediate |
| Security issue | On-call SRE | Security Team | Immediate |

---

## 📋 Communication Template

**For Slack #announcements**:
```
🚀 CMDB Unificado deployment started at [TIME]
✅ Features being rolled out:
  - Unified dependency graph visualization
  - Global search across servers, apps, databases, URLs
  - Impact analysis (blast radius simulation)
  - Database and URL management

📊 Monitoring: https://grafana.prod/cmdb
🔗 Docs: https://wiki.example.com/cmdb

Expected duration: 1.5-2.5 hours
Questions? Ask in #cmdb-prod-deployment
```

**After Success**:
```
✅ CMDB Unificado v1.0.0 deployed successfully!
🟢 All systems healthy, feature live for all users
📈 Metrics: API latency p95 ~150ms, error rate 0.02%
🎉 Thanks to [Team]!
```

**If Rollback Needed**:
```
⚠️ CMDB v1.0.0 rollback completed at [TIME]
✅ Previous version restored
🔍 RCA scheduled for [DATE] at [TIME]
📝 Details: [INCIDENT_LINK]
```

---

**Document Version**: 1.0.0
**Last Updated**: 2026-08-16
**Next Review**: After production deployment
**Owner**: DevOps Lead
