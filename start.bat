@echo off
chcp 65001 > nul
echo ===================================================
echo        AuraShorts OS v2.0 Launcher
echo ===================================================
echo.
echo [1/2] Dang khoi dong FastAPI Backend tren cong 8000...
start "AuraShorts Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Dang khoi dong Vite Frontend tren cong 5173...
start "AuraShorts Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo  He thong da khoi dong thanh cong!
echo  - Backend API:    http://localhost:8000/docs
echo  - Frontend Web:   http://localhost:5173
echo ===================================================
echo.
pause
