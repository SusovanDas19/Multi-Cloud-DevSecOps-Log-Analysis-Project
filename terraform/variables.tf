variable "project_name" {
  default     = "logguard"
  description = "Base name used for all resources"
}

variable "azure_region" {
  default     = "eastasia"
  description = "Azure region"
}

variable "aws_region" {
  default     = "ap-south-1"
  description = "AWS region"
}

variable "admin_ssh_public_key_path" {
  default     = "~/.ssh/logguard_key.pub"
  description = "Path to your SSH public key"
}

variable "db_admin_password" {
  description = "Password for PostgreSQL admin user"
  sensitive   = true
}