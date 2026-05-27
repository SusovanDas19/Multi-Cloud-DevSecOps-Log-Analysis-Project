variable "project_name" {}
variable "azure_region" {}
variable "admin_ssh_public_key_path" {}
variable "db_admin_password" {
  sensitive = true
}