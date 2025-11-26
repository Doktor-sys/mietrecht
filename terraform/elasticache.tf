resource "aws_elasticache_subnet_group" "redis" {
  name       = "smartlaw-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Environment = var.environment
    Project     = "smartlaw"
  }
}

resource "aws_security_group" "redis" {
  name        = "smartlaw-redis-sg"
  description = "Security group for Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Project     = "smartlaw"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "smartlaw-redis-${var.environment}"
  description                   = "Redis for SmartLaw"
  node_type                     = "cache.t3.micro"
  port                          = 6379
  parameter_group_name          = "default.redis7"
  automatic_failover_enabled    = false
  num_node_groups               = 1
  replicas_per_node_group       = 0
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [aws_security_group.redis.id]
  engine                        = "redis"
  engine_version                = "7.0"

  tags = {
    Environment = var.environment
    Project     = "smartlaw"
  }
}
