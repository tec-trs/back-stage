# Terraform - Base Infrastructure (AWS)

Provisiona a infraestrutura base do back-stage na AWS: VPC, cluster EKS, RDS PostgreSQL, ElastiCache Redis e repositorios ECR (backend/frontend).

## Uso

```bash
cp terraform.tfvars.example terraform.tfvars
export TF_VAR_db_password="<senha-forte>"

terraform init \
  -backend-config="bucket=<seu-bucket-de-state>" \
  -backend-config="key=back-stage/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=<sua-tabela-de-lock>"

terraform plan
terraform apply
```

## Recursos provisionados

- `versions.tf` — providers e backend remoto (S3 + DynamoDB lock, configurados via `-backend-config`).
- `vpc.tf` — VPC com subnets publicas/privadas, NAT Gateway, security groups para RDS e Redis.
- `eks.tf` — cluster EKS gerenciado (`terraform-aws-modules/eks`) com node group padrao.
- `rds.tf` — instancia RDS PostgreSQL 16 (multi-AZ em producao).
- `redis.tf` — ElastiCache Redis (replication group, encriptado em transito e em repouso).
- `ecr.tf` — repositorios ECR para as imagens de backend e frontend, com scan automatico e lifecycle policy.
- `outputs.tf` — endpoints e identificadores usados pelo Helm/CI-CD.

Apos o `apply`, configure o `kubectl`:

```bash
aws eks update-kubeconfig --name <eks_cluster_name> --region <aws_region>
```
