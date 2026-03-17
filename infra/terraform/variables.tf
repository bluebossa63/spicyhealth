variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  sensitive   = true
}

variable "client_id" {
  description = "Azure service principal client ID (for Terraform auth)"
  type        = string
  sensitive   = true
}

variable "client_secret" {
  description = "Azure service principal client secret (for Terraform auth)"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
  sensitive   = true
}

variable "app_name" {
  description = "Application name used as resource name prefix"
  type        = string
  default     = "spicyhealth"
}

variable "environment" {
  description = "Deployment environment (prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "westeurope"
}

variable "cosmos_db_name" {
  description = "Cosmos DB database name"
  type        = string
  default     = "spicyhealth"
}

variable "b2c_tenant" {
  description = "Azure AD B2C tenant name (e.g. spicyhealthb2c)"
  type        = string
}

variable "b2c_policy" {
  description = "Azure AD B2C user flow name"
  type        = string
  default     = "B2C_1_signupsignin"
}
