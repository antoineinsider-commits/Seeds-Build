terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

# Primary VPC
resource "aws_vpc" "seeds_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "seeds-vpc-${var.environment}"
    Environment = var.environment
  }
}

# PostgreSQL Database (RDS instance)
resource "aws_db_instance" "postgres" {
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = "db.t4g.micro"
  db_name                = "seeds_db"
  username               = "seeds_admin"
  password               = var.db_password
  skip_final_snapshot    = true
  publicly_accessible    = false
}

variable "db_password" {
  description = "Master password for the RDS instance. Supply via TF_VAR_db_password or a secrets backend — never commit a real value here."
  type        = string
  sensitive   = true
}

# Redis ElastiCache Instance
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "seeds-redis-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# Encrypted S3 Bucket for Media & Verification Documents
resource "aws_s3_bucket" "uploads" {
  bucket = "seeds-platform-uploads-${var.environment}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_encryption" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
