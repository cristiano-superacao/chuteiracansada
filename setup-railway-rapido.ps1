# Script de Configuração Rápida Railway
# Execute: .\setup-railway-rapido.ps1

Write-Host "`n🎯 CONFIGURAÇÃO RAILWAY - AUTOMÁTICA" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Verificar se Railway CLI está instalado
try {
    $railwayVersion = railway --version 2>$null
    Write-Host "✅ Railway CLI instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 ETAPA 1: Adicionar PostgreSQL" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

# Abrir Railway Dashboard
Write-Host "`n🌐 Abrindo Railway Dashboard..." -ForegroundColor Cyan
Start-Process "https://railway.app"

Write-Host "`n📝 NO NAVEGADOR, FAÇA:" -ForegroundColor White
Write-Host "   1. Clique no botão [+ New]" -ForegroundColor White
Write-Host "   2. Selecione: Database → Add PostgreSQL" -ForegroundColor White
Write-Host "   3. Aguarde 20 segundos (ícone verde)" -ForegroundColor White

Write-Host "`n⏳ Aguardando você adicionar PostgreSQL..." -ForegroundColor Cyan
Read-Host "`nPressione ENTER após adicionar PostgreSQL"

Write-Host "`n📋 ETAPA 2: Obter DATABASE_URL" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

Write-Host "`n🔄 Tentando obter DATABASE_URL automaticamente..." -ForegroundColor Cyan

# Tentar obter variáveis do Railway
try {
    $varsOutput = railway variables --json 2>&1 | Out-String
    
    if ($varsOutput -match 'DATABASE_URL') {
        # Parse JSON para extrair DATABASE_URL
        $vars = $varsOutput | ConvertFrom-Json
        $databaseUrl = $vars | Where-Object { $_.name -eq 'DATABASE_URL' } | Select-Object -ExpandProperty value
        
        if ($databaseUrl) {
            Write-Host "   ✅ DATABASE_URL encontrado automaticamente!" -ForegroundColor Green
            Write-Host "   $($databaseUrl.Substring(0, [Math]::Min(50, $databaseUrl.Length)))..." -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "   ⚠️  Método automático falhou" -ForegroundColor Yellow
}

# Se não conseguiu automaticamente, pedir manualmente
if (-not $databaseUrl) {
    Write-Host "`n💡 Por favor, copie a DATABASE_URL do Railway:" -ForegroundColor Yellow
    Write-Host "   1. No Railway, clique no card PostgreSQL" -ForegroundColor White
    Write-Host "   2. Vá na aba 'Connect'" -ForegroundColor White
    Write-Host "   3. Copie a 'Postgres Connection URL'" -ForegroundColor White
    
    Write-Host "`n📋 Cole aqui a DATABASE_URL:" -ForegroundColor Cyan
    $databaseUrl = Read-Host "DATABASE_URL"
    
    if (-not $databaseUrl) {
        Write-Host "`n❌ DATABASE_URL não fornecido" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n📋 ETAPA 3: Atualizar .env" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

# Fazer backup do .env
if (Test-Path ".env") {
    Copy-Item ".env" ".env.backup" -Force
    Write-Host "   ✅ Backup criado: .env.backup" -ForegroundColor Green
}

# Atualizar .env
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$databaseUrl"
Set-Content ".env" -Value $envContent

Write-Host "   ✅ Arquivo .env atualizado!" -ForegroundColor Green
Write-Host "   DATABASE_URL configurado" -ForegroundColor Cyan

Write-Host "`n📋 ETAPA 4: Testar Conexão" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

Write-Host "`n🔌 Testando conexão com banco de dados...`n" -ForegroundColor Cyan

node server/test-system.js

Write-Host "`n📋 ETAPA 5: Popular Banco" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow

$seed = Read-Host "`nDeseja popular o banco com dados de teste? (S/n)"

if ($seed -eq "" -or $seed -eq "S" -or $seed -eq "s") {
    Write-Host "`n🌱 Populando banco com 460+ registros...`n" -ForegroundColor Cyan
    node server/seed-database.js
    
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
    
    Write-Host "`n🚀 Próximos Passos:" -ForegroundColor Blue
    Write-Host "   1️⃣  Iniciar servidor: npm start" -ForegroundColor Cyan
    Write-Host "   2️⃣  Acessar: http://localhost:3000/login.html" -ForegroundColor Cyan
    Write-Host "   3️⃣  Login Admin: admin@admin / (senha definida em ADMIN_PASSWORD)" -ForegroundColor Cyan
    Write-Host "   4️⃣  Login Associado: carlos.silva@gmail.com / 123456" -ForegroundColor Cyan
    
    Write-Host "`n📦 Banco populado com:" -ForegroundColor Blue
    Write-Host "   • 15 associados" -ForegroundColor Cyan
    Write-Host "   • 15 jogadores (5 times)" -ForegroundColor Cyan
    Write-Host "   • 180 pagamentos (12 meses)" -ForegroundColor Cyan
    Write-Host "   • 16 jogos de campeonato" -ForegroundColor Cyan
    Write-Host "   • Posts, vídeos e imagens`n" -ForegroundColor Cyan
} else {
    Write-Host "`n⏭️  Pulado. Execute depois:" -ForegroundColor Yellow
    Write-Host "   node server/seed-database.js`n" -ForegroundColor Cyan
}

Write-Host "Pressione ENTER para finalizar..."
Read-Host
