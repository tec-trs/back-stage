terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }

  backend "s3" {
    # Preencher via -backend-config no `terraform init` (bucket, key, region, dynamodb_table).
    # Nao commitar valores reais de backend neste arquivo.
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "back-stage"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
