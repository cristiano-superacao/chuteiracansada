Write-Host "`nCONFIGURACAO DO BANCO DE DADOS RAILWAY" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

Write-Host "Abrindo Railway dashboard..." -ForegroundColor Yellow
Start-Process "https://railway.app"

Write-Host "`nPASSO A PASSO:" -ForegroundColor Yellow
Write-Host "1. No dashboard, clique no servico PostgreSQL"
Write-Host "2. Na aba Connect, procure 'Public Network'"
Write-Host "3. Copie a 'Postgres Connection URL' (URL PUBLICA)`n"

$url = Read-Host "Cole a URL PUBLICA aqui"

if (-not $url) {
    Write-Host "`nURL nao fornecida. Saindo..." -ForegroundColor Red
    exit 1
}

if ($url -notmatch '^postgresql://') {
    Write-Host "`nURL invalida! Deve comecar com 'postgresql://'" -ForegroundColor Red
    exit 1
}

Write-Host "`nURL recebida! Atualizando .env..." -ForegroundColor Green

if (Test-Path ".env") {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item ".env" ".env.backup.$timestamp"
    Write-Host "Backup criado: .env.backup.$timestamp" -ForegroundColor Gray
}

$content = Get-Content ".env" -Raw
$content = $content -replace 'DATABASE_URL=.*', "DATABASE_URL=$url"
Set-Content ".env" -Value $content -NoNewline

Write-Host ".env atualizado!`n" -ForegroundColor Green

Write-Host "Testando conexao..." -ForegroundColor Yellow
node server/test-system.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nConexao OK!`n" -ForegroundColor Green
    
    $seed = Read-Host "Popular banco com dados de teste? (S/N)"
    
    if ($seed -match '^[SsYy]') {
        Write-Host "`nPopulando banco..." -ForegroundColor Yellow
        node server/seed-database.js
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nBANCO POPULADO COM SUCESSO!" -ForegroundColor Green
            Write-Host "`nDados criados:" -ForegroundColor Yellow
            Write-Host "- 15 associados"
            Write-Host "- 15 jogadores em 5 times"
            Write-Host "- 180 pagamentos"
            Write-Host "- 16 jogos de campeonato"
            Write-Host "- Posts, videos e imagens`n"
            
            Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
            Write-Host "1. Iniciar servidor: npm start"
            Write-Host "2. Acessar: http://localhost:3000/login.html"
            Write-Host "3. Login admin: admin@admin / (senha definida em ADMIN_PASSWORD)"
            Write-Host "4. Login associado: carlos.silva@gmail.com / 123456`n"
            
            $start = Read-Host "Iniciar servidor agora? (S/N)"
            
            if ($start -match '^[SsYy]') {
                Write-Host "`nIniciando servidor...`n" -ForegroundColor Green
                npm start
            }
        }
    }
}
else {
    Write-Host "`nERRO NA CONEXAO!" -ForegroundColor Red
    Write-Host "Verifique a URL e tente novamente.`n" -ForegroundColor Yellow
}
