@echo off
chcp 65001 > nul
echo.
echo 🚀 CONFIGURAÇÃO RAILWAY - PASSO A PASSO
echo ============================================================
echo.
echo ✅ Projeto criado: chuteira-cansada
echo 🌐 URL: https://railway.app
echo.
echo ============================================================
echo 📋 SIGA ESTES PASSOS NO NAVEGADOR:
echo ============================================================
echo.
echo 1️⃣  Clique no botão [+ New] no canto superior direito
echo.
echo 2️⃣  Selecione: Database
echo.
echo 3️⃣  Escolha: Add PostgreSQL
echo.
echo 4️⃣  Aguarde 20 segundos (Railway criará o banco)
echo.
echo 5️⃣  ✅ PostgreSQL criado! (ícone verde)
echo.
echo 6️⃣  Clique no card PostgreSQL
echo.
echo 7️⃣  Vá na aba: Connect
echo.
echo 8️⃣  Copie a "Postgres Connection URL"
echo     (Exemplo: postgresql://postgres:senha@xyz.railway.app:5432/railway)
echo.
echo ============================================================
echo.
echo 🌐 Abrindo Railway no navegador...
echo.
timeout /t 2 /nobreak > nul

start "" "https://railway.app"

echo.
echo Pressione qualquer tecla DEPOIS de adicionar PostgreSQL...
pause > nul

cls
echo.
echo ✅ PostgreSQL adicionado! Agora vamos obter a URL...
echo.
echo 📋 Cole aqui a DATABASE_URL que você copiou do Railway:
echo.
set /p DATABASE_URL="DATABASE_URL: "

echo.
echo 💾 Salvando no arquivo .env...

REM Criar backup do .env
copy /Y .env .env.backup > nul

REM Ler o arquivo .env e substituir DATABASE_URL
powershell -Command "$content = Get-Content -Path '.env' -Raw; $content = $content -replace 'DATABASE_URL=.*', 'DATABASE_URL=%DATABASE_URL%'; Set-Content -Path '.env' -Value $content"

echo ✅ .env atualizado!
echo.
echo 🔍 Testando conexão com banco...
echo.

node server/test-system.js

echo.
echo ============================================================
echo.
echo 🌱 Deseja popular o banco de dados agora? (S/N)
set /p SEED="Resposta: "

if /i "%SEED%"=="S" (
    echo.
    echo 🌱 Populando banco com 460+ registros...
    echo.
    node server/seed-database.js
    echo.
    echo ============================================================
    echo ✅ CONFIGURAÇÃO CONCLUÍDA!
    echo ============================================================
    echo.
    echo 🚀 Próximos passos:
    echo    1. npm start
    echo    2. Acesse: http://localhost:3000/login.html
    echo    3. Login: admin@admin / (senha definida em ADMIN_PASSWORD)
    echo.
) else (
    echo.
    echo ⏭️  Pulado. Execute depois: node server/seed-database.js
    echo.
)

echo Pressione qualquer tecla para finalizar...
pause > nul
