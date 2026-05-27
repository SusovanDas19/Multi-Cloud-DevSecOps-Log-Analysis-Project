module "azure" {
  source = "./modules/azure"

  project_name              = var.project_name
  azure_region              = var.azure_region
  admin_ssh_public_key_path = var.admin_ssh_public_key_path
  db_admin_password         = var.db_admin_password
}

module "aws" {
  source = "./modules/aws"

  project_name = var.project_name
  aws_region   = var.aws_region
}