# Script definitivo para configurar Railway via API REST
$ErrorActionPreference = "Stop"

# IDs do projeto
$PROJECT_ID = "ca500b5d-0289-48be-92a6-2b0afef3b774"
$SERVICE_ID = "ef6e2096-8bbc-417b-bbf4-b547d666905a"
$ENV_ID = "e1aca24d-3810-47d3-bc07-6d25750cc96a"
$POSTGRES_SERVICE_ID = "0e266673-d274-46d5-a161-6b63eedacc20"

# Token
$config = Get-Content "$env:USERPROFILE\.railway\config.json" -Raw | ConvertFrom-Json
$TOKEN = $config.user.token

if (-not $TOKEN) {
    Write-Host "Erro: Token nao encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "Configurando variaveis via API Railway..." -ForegroundColor Cyan

# Headers
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

# GraphQL para upsert de variáveis
$query = @"
mutation VariableUpsert(`$input: VariableUpsertInput!) {
  variableUpsert(input: `$input)
}
"@

# Variável 1: DATABASE_PUBLIC_URL (referência)
$variables1 = @{
    input = @{
        environmentId = $ENV_ID
        serviceId = $SERVICE_ID
        name = "DATABASE_PUBLIC_URL"
        referenceVariableId = "${POSTGRES_SERVICE_ID}:DATABASE_PUBLIC_URL"
    }
} | ConvertTo-Json -Depth 10

$body1 = @{
    query = $query
    variables = $variables1
} | ConvertTo-Json -Depth 10

# Variável 2: NODE_ENV
$variables2 = @{
    input = @{
        environmentId = $ENV_ID
        serviceId = $SERVICE_ID
        name = "NODE_ENV"
        value = "production"
    }
} | ConvertTo-Json -Depth 10

$body2 = @{
    query = $query
    variables = $variables2
} | ConvertTo-Json -Depth 10

try {
    # Criar DATABASE_PUBLIC_URL
    Write-Host "1/2 Adicionando DATABASE_PUBLIC_URL..." -ForegroundColor Yellow
    $response1 = Invoke-RestMethod -Method Post -Uri "https://backboard.railway.app/graphql/v2" -Headers $headers -Body $body1 -ContentType "application/json"
    Write-Host "    OK DATABASE_PUBLIC_URL" -ForegroundColor Green
    
    # Criar NODE_ENV
    Write-Host "2/2 Configurando NODE_ENV=production..." -ForegroundColor Yellow
    $response2 = Invoke-RestMethod -Method Post -Uri "https://backboard.railway.app/graphql/v2" -Headers $headers -Body $body2 -ContentType "application/json"
    Write-Host "    OK NODE_ENV" -ForegroundColor Green
    
    Write-Host "`nVariaveis configuradas!" -ForegroundColor Green
    Write-Host "Fazendo redeploy..." -ForegroundColor Cyan
    
    # Trigger redeploy
    npx railway up --detach
    
    Write-Host "`nSucesso! Aguarde 60s e teste:" -ForegroundColor Green
    Write-Host "https://chuteiracansada.up.railway.app/api/health" -ForegroundColor Cyan
}
catch {
    Write-Host "`nErro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nResposta completa:" -ForegroundColor Yellow
    Write-Host ($_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
    Write-Host "`nConfigurar manualmente:" -ForegroundColor Yellow
    Write-Host "1. npx railway open" -ForegroundColor White
    Write-Host "2. Variables > New Variable" -ForegroundColor White
    Write-Host "3. DATABASE_PUBLIC_URL = Reference > Postgres > DATABASE_PUBLIC_URL" -ForegroundColor White
    Write-Host "4. NODE_ENV = production" -ForegroundColor White
}
