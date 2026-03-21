terraform {
  required_version = ">= 1.7"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-spicyhealth-tfstate"
    storage_account_name = "spicyhealthtfstate"
    container_name       = "tfstate"
    key                  = "spicyhealth.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.app_name}-${var.environment}"
  location = var.location
  tags     = local.tags
}

# Azure Static Web App (Next.js frontend)
resource "azurerm_static_web_app" "frontend" {
  name                = "${var.app_name}-web-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  sku_tier            = "Standard"
  sku_size            = "Standard"
  tags                = local.tags
}

# Custom domain — spicyhealth.niceneasy.ch (CNAME → SWA default hostname)
resource "azurerm_static_web_app_custom_domain" "frontend" {
  static_web_app_id = azurerm_static_web_app.frontend.id
  domain_name       = "spicyhealth.niceneasy.ch"
  validation_type   = "cname-delegation"
}

# App Service Plan (Linux, Node.js API)
resource "azurerm_service_plan" "api" {
  name                = "${var.app_name}-plan-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = local.tags
}

# App Service (Node.js API)
resource "azurerm_linux_web_app" "api" {
  name                = "${var.app_name}-api-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  service_plan_id     = azurerm_service_plan.api.id
  tags                = local.tags

  site_config {
    application_stack {
      node_version = "20-lts"
    }
    health_check_path = "/health"
  }

  app_settings = {
    COSMOS_ENDPOINT    = azurerm_cosmosdb_account.main.endpoint
    COSMOS_DB_NAME     = var.cosmos_db_name
    COSMOS_KEY         = azurerm_cosmosdb_account.main.primary_key
    B2C_TENANT         = var.b2c_tenant
    B2C_POLICY         = var.b2c_policy
    ALLOWED_ORIGIN     = "https://spicyhealth.niceneasy.ch,https://${azurerm_static_web_app.frontend.default_host_name}"
    STORAGE_ACCOUNT    = azurerm_storage_account.media.name
    STORAGE_CONTAINER  = azurerm_storage_container.media.name
    STORAGE_KEY        = azurerm_storage_account.media.primary_access_key
    NODE_ENV           = "production"
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    GOOGLE_REDIRECT_URI  = "https://spicyhealth-api-prod.azurewebsites.net/api/auth/google/callback"
    ANTHROPIC_API_KEY    = var.anthropic_api_key
    OPENROUTER_API_KEY   = var.openrouter_api_key
    OPENROUTER_MODEL     = "openrouter/free"
    STYLE_LLM_PROVIDER   = "anthropic"
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.main.connection_string
    ApplicationInsightsAgent_EXTENSION_VERSION = "~3"
  }

  https_only = true
}

# Cosmos DB Account
resource "azurerm_cosmosdb_account" "main" {
  name                = "${var.app_name}-cosmos-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"
  tags                = local.tags

  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }
}

# Cosmos DB — database
resource "azurerm_cosmosdb_sql_database" "main" {
  name                = var.cosmos_db_name
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

# Cosmos DB — containers
resource "azurerm_cosmosdb_sql_container" "recipes" {
  name                = "recipes"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/category"

  indexing_policy {
    indexing_mode = "consistent"

    included_path { path = "/*" }
    included_path { path = "/category/?" }
    included_path { path = "/authorId/?" }
    included_path { path = "/tags/[]/?" }
    included_path { path = "/deleted/?" }

    excluded_path { path = "/instructions/*" }
    excluded_path { path = "/description/?" }
  }
}

resource "azurerm_cosmosdb_sql_container" "meal_plans" {
  name                = "meal-plans"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/userId"
}

resource "azurerm_cosmosdb_sql_container" "users" {
  name                = "users"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/id"

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    included_path {
      path = "/email/?"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "comments" {
  name                = "comments"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/recipeId"

  indexing_policy {
    indexing_mode = "consistent"

    included_path { path = "/*" }
    included_path { path = "/recipeId/?" }
    included_path { path = "/authorId/?" }
    included_path { path = "/parentId/?" }
    included_path { path = "/createdAt/?" }

    excluded_path { path = "/body/?" }
  }
}

resource "azurerm_cosmosdb_sql_container" "shopping_lists" {
  name                = "shopping-lists"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/userId"
}

resource "azurerm_cosmosdb_sql_container" "conversations" {
  name                = "conversations"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/userId"
}

# Storage Account (images / avatars)
resource "azurerm_storage_account" "media" {
  name                     = "${replace(var.app_name, "-", "")}media${var.environment}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = local.tags

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "PUT", "POST"]
      allowed_origins    = ["https://spicyhealth.niceneasy.ch", "https://${azurerm_static_web_app.frontend.default_host_name}"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
}

resource "azurerm_storage_container" "media" {
  name                  = "media"
  storage_account_name  = azurerm_storage_account.media.name
  container_access_type = "blob"
}

# Log Analytics Workspace (required for workspace-based Application Insights)
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.app_name}-logs-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.app_name}-insights-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  application_type    = "Node.JS"
  workspace_id        = azurerm_log_analytics_workspace.main.id
  tags                = local.tags
}

# Blob lifecycle policy — delete orphaned uploads after 30 days
resource "azurerm_storage_management_policy" "media" {
  storage_account_id = azurerm_storage_account.media.id

  rule {
    name    = "delete-old-uploads"
    enabled = true

    filters {
      prefix_match = ["media/tmp/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 30
      }
    }
  }
}

# Staging slot requires Standard+ SKU — disabled on Basic tier
# resource "azurerm_linux_web_app_slot" "staging" { ... }

locals {
  tags = {
    project     = var.app_name
    environment = var.environment
    managed_by  = "terraform"
  }
}
