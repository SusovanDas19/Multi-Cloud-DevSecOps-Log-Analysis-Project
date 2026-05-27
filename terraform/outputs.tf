output "azure_vm_public_ip" {
  description = "Public IP of the Azure VM — use this everywhere"
  value       = module.azure.vm_public_ip
}

output "azure_db_host" {
  description = "PostgreSQL server FQDN"
  value       = module.azure.db_fqdn
}

output "azure_key_vault_uri" {
  description = "Azure Key Vault URI"
  value       = module.azure.key_vault_uri
}

output "aws_s3_bucket_name" {
  description = "S3 bucket name for agent installer and assets"
  value       = module.aws.s3_bucket_name
}