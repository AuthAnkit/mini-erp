@echo off
REM Script to setup backend development environment (Windows)

echo 🚀 Mini ERP Backend Setup Script
echo ==================================
echo.

REM Check Java version
echo ✓ Checking Java version...
java -version
echo.

REM Check Maven
echo ✓ Checking Maven...
mvn --version
echo.

REM Clean and build
echo ✓ Building backend...
mvn clean install
echo.

REM Run backend
echo ✓ Starting backend...
mvn spring-boot:run

echo.
echo ✓ Backend should be running on http://localhost:8080
echo ✓ H2 Console: http://localhost:8080/h2-console
pause

