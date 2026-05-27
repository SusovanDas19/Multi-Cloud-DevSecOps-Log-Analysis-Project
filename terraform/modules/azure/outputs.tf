output "vm_public_ip" {
  value = azurerm_public_ip.pip.ip_address
}

output "db_fqdn" {
  value = azurerm_postgresql_flexible_server.db.fqdn
}

output "key_vault_uri" {
  value = azurerm_key_vault.kv.vault_uri
}

output "key_vault_name" {
  value = azurerm_key_vault.kv.name
}