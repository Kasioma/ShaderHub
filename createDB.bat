@echo off
set CONTAINER_NAME=origin-db

:: Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed. Please install Docker and try again.
    echo Docker install guide: https://docs.docker.com/engine/install/
    exit /b 1
)

:: Check if Docker daemon is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker daemon is not running. Please start Docker and try again.
    exit /b 1
)

:: Check if container is already running
docker ps -f name=%CONTAINER_NAME% | findstr %CONTAINER_NAME% >nul 2>&1
if not "%ERRORLEVEL%"=="1" (
    echo Database container '%CONTAINER_NAME%' already running.
    exit /b 0
)

:: Check if container exists but is stopped
docker ps -a -f name=%CONTAINER_NAME% | findstr %CONTAINER_NAME% >nul 2>&1
if not "%ERRORLEVEL%"=="1" (
    docker start %CONTAINER_NAME%
    echo Existing database container '%CONTAINER_NAME%' started.
    exit /b 0
)

:: Set environment variables from .env.local
for /f "tokens=* delims=" %%x in ('type .env') do set %%x

echo %POSTGRES_USER% %POSTGRES_PASSWORD% %POSTGRES_DB% %DATABASE_PORT%

:: Create and run the database container
docker run -d ^
  --name %CONTAINER_NAME% ^
  -e POSTGRES_USER=%POSTGRES_USER% ^
  -e POSTGRES_PASSWORD=%POSTGRES_PASSWORD% ^
  -e POSTGRES_DB=%POSTGRES_DB% ^
  -p %DATABASE_PORT%:5432 ^
  postgres:17-alpine && echo Database container '%CONTAINER_NAME%' was successfully created.
