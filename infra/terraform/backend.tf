# Remote state backend — create this storage account manually ONCE before running terraform init:
#
#   az group create -n rg-spicyhealth-tfstate -l westeurope
#   az storage account create -n spicyhealthtfstate -g rg-spicyhealth-tfstate --sku Standard_LRS
#   az storage container create -n tfstate --account-name spicyhealthtfstate
#
# Then run: terraform init

# Backend config is in main.tf (backend "azurerm" block).
# This file is a placeholder for documentation only.
