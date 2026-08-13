resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name}-redis"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.name}-redis"
  description           = "Redis cache do back-stage (${var.environment})"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = var.redis_node_type

  num_cache_clusters = var.redis_num_cache_nodes

  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = { Name = "${local.name}-redis" }
}
