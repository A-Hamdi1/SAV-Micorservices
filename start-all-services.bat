@echo off
chcp 65001 > nul
echo ================================================
echo      SAV Microservices - Startup Script
echo ================================================
echo.
echo Starting all microservices...
echo.

echo [1/6] Starting Auth API on port 5001...
start "Auth API" cmd /k "cd src\Services\Auth\SAV.Auth.API && dotnet run"
timeout /t 5 /nobreak > nul

echo [2/6] Starting Clients API on port 5002...
start "Clients API" cmd /k "cd src\Services\Clients\SAV.Clients.API && dotnet run"
timeout /t 3 /nobreak > nul

echo [3/6] Starting Interventions API on port 5003...
start "Interventions API" cmd /k "cd src\Services\Interventions\SAV.Interventions.API && dotnet run"
timeout /t 3 /nobreak > nul

echo [4/6] Starting Articles API on port 5004...
start "Articles API" cmd /k "cd src\Services\Articles\SAV.Articles.API && dotnet run"
timeout /t 3 /nobreak > nul

echo [5/6] Starting Payments API on port 5005...
start "Payments API" cmd /k "cd src\Services\Payments\SAV.Payments.API && dotnet run"
timeout /t 3 /nobreak > nul

echo [6/6] Starting Gateway on port 5000...
start "Gateway" cmd /k "cd src\Gateway\SAV.Gateway && dotnet run"

echo.
echo ================================================
echo    All services are starting!
echo    Wait 15-20 seconds for all services to be ready
echo ================================================
echo.
echo API Gateway:      https://localhost:5000
echo Auth API:         https://localhost:5001/swagger
echo Clients API:      https://localhost:5002/swagger
echo Interventions API: https://localhost:5003/swagger
echo Articles API:     https://localhost:5004/swagger
echo Payments API:     https://localhost:5005/swagger
echo.
echo Frontend: Run 'npm run dev' in frontend folder (http://localhost:3000)
echo.
pause
