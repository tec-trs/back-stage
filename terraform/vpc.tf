locals {
  name = "${var.project_name}-${var.environment}"

  private_subnets = [
    for index, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, index)
  ]
  public_subnets = [
    for index, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, index + length(var.availability_zones))
  ]
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.13"

  name = local.name
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = local.private_subnets
  public_subnets  = local.public_subnets

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "production"
  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  tags = {
    Name = local.name
  }
}

resource "aws_security_group" "rds" {
  name        = "${local.name}-rds"
  description = "Acesso ao RDS PostgreSQL a partir da VPC"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "PostgreSQL a partir da VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-rds" }
}

resource "aws_security_group" "redis" {
  name        = "${local.name}-redis"
  description = "Acesso ao ElastiCache Redis a partir da VPC"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Redis a partir da VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-redis" }
}
