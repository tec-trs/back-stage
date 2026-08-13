resource "aws_db_subnet_group" "postgres" {
  name       = "${local.name}-postgres"
  subnet_ids = module.vpc.private_subnets

  tags = { Name = "${local.name}-postgres" }
}

resource "aws_db_instance" "postgres" {
  identifier     = "${local.name}-postgres"
  engine         = "postgres"
  engine_version = "16"

  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az                  = var.environment == "production"
  backup_retention_period   = var.environment == "production" ? 7 : 1
  deletion_protection       = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  auto_minor_version_upgrade = true

  tags = { Name = "${local.name}-postgres" }
}
