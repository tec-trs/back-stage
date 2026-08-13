variable "aws_region" {
  description = "Regiao AWS onde a infraestrutura sera provisionada"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Nome do ambiente (development, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "environment deve ser development, staging ou production."
  }
}

variable "project_name" {
  description = "Prefixo usado no nome dos recursos"
  type        = string
  default     = "back-stage"
}

variable "vpc_cidr" {
  description = "CIDR block da VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones utilizadas pelas subnets"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "eks_cluster_version" {
  description = "Versao do Kubernetes no cluster EKS"
  type        = string
  default     = "1.30"
}

variable "eks_node_instance_types" {
  description = "Tipos de instancia EC2 para os node groups do EKS"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "eks_node_desired_size" {
  description = "Quantidade desejada de nodes no node group principal"
  type        = number
  default     = 3
}

variable "eks_node_min_size" {
  description = "Quantidade minima de nodes no node group principal"
  type        = number
  default     = 2
}

variable "eks_node_max_size" {
  description = "Quantidade maxima de nodes no node group principal"
  type        = number
  default     = 6
}

variable "db_instance_class" {
  description = "Classe da instancia RDS PostgreSQL"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Armazenamento alocado (GB) para o RDS PostgreSQL"
  type        = number
  default     = 50
}

variable "db_name" {
  description = "Nome do banco de dados PostgreSQL"
  type        = string
  default     = "backstage"
}

variable "db_username" {
  description = "Usuario administrador do RDS PostgreSQL"
  type        = string
  default     = "backstage"
  sensitive   = true
}

variable "db_password" {
  description = "Senha do usuario administrador do RDS PostgreSQL (definir via TF_VAR_db_password ou tfvars nao versionado)"
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "Tipo de instancia do ElastiCache Redis"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Numero de nodes no cluster ElastiCache Redis"
  type        = number
  default     = 1
}
