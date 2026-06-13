@echo off
REM Mini ERP Backend Startup Script
REM This script runs the backend with proper configuration

cd /d D:\Zero-Project\min-erp\mini-erp\backend

echo ========================================
echo Mini ERP Backend Startup
echo ========================================
echo.
echo Killing any existing Java processes...
taskkill /F /IM java.exe >nul 2>&1

echo Waiting 3 seconds...
timeout /t 3 /nobreak

echo.
echo Starting backend (please wait 20-30 seconds)...
echo.

D:\Zero-Project\min-erp\mini-erp\maven\apache-maven-3.9.6\bin\mvn.cmd clean spring-boot:run

echo.
echo ========================================
echo Backend should be running on http://localhost:8080
echo H2 Console: http://localhost:8080/h2-console
echo ========================================
echo.
pause

