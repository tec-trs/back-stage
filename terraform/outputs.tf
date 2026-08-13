output "vpc_id" {
  description = "ID da VPC provisionada"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "Nome do cluster EKS"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint da API do cluster EKS"
  value       = module.eks.cluster_endpoint
}

output "postgres_endpoint" {
  description = "Endpoint do RDS PostgreSQL"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "redis_primary_endpoint" {
  description = "Endpoint primario do ElastiCache Redis"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "ecr_backend_repository_url" {
  description = "URL do repositorio ECR do backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "URL do repositorio ECR do frontend"
  value       = aws_ecr_repository.frontend.repository_url
}
