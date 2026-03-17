# Infrastructure — Terraform

Manages all Azure resources for SpicyHealth.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.7
- Azure CLI (`az login`) or service principal credentials
- A service principal with `Contributor` role on the subscription

## Bootstrap (once only)

Create the remote state storage before first `terraform init`:

```bash
az group create -n rg-spicyhealth-tfstate -l westeurope
az storage account create -n spicyhealthtfstate -g rg-spicyhealth-tfstate --sku Standard_LRS
az storage container create -n tfstate --account-name spicyhealthtfstate
```

## Usage

```bash
cd infra/terraform

# Copy and fill in credentials
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## After apply

Get the SWA deployment token (needed as GitHub Actions secret):

```bash
terraform output -raw static_web_app_api_key
```

Set it as `AZURE_STATIC_WEB_APPS_TOKEN` in your GitHub repo secrets.
Get the App Service publish profile from the Azure portal and set it as `AZURE_API_PUBLISH_PROFILE`.
