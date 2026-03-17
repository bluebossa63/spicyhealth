output "static_web_app_url" {
  description = "Frontend URL"
  value       = "https://${azurerm_static_web_app.frontend.default_host_name}"
}

output "static_web_app_api_key" {
  description = "SWA deployment token (use as AZURE_STATIC_WEB_APPS_TOKEN secret)"
  value       = azurerm_static_web_app.frontend.api_key
  sensitive   = true
}

output "api_url" {
  description = "API URL"
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "cosmos_endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "storage_account_name" {
  description = "Blob Storage account name"
  value       = azurerm_storage_account.media.name
}

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}
