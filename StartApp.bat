@echo off
SETLOCAL EnableDelayedExpansion

:: --- CONFIGURATION ---
SET "NODE_VERSION=v20.11.1"
SET "NODE_ZIP=node-%NODE_VERSION%-win-x64.zip"
SET "NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%NODE_ZIP%"
SET "BIN_DIR=%~dp0bin"
SET "NODE_EXE=%BIN_DIR%\node.exe"

echo ========================================
echo   FINANCIAL HUB - PORTABLE LAUNCHER
echo ========================================

:: 1. Check for local Node.js
if exist "%NODE_EXE%" (
    echo [OK] Using local Node.js runtime.
    SET "PATH=%BIN_DIR%;%PATH%"
    goto :LINT_CHECK
)

:: 2. Check for system Node.js
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Local runtime missing, but system Node.js found.
    goto :LINT_CHECK
)

:: 3. Auto-Download Node.js (First Time Setup)
echo [SETUP] Node.js is required but not found.
echo [SETUP] Automatically downloading portable runtime...
echo [SETUP] Source: %NODE_URL%

if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"

powershell -NoProfile -Command "& { $ErrorActionPreference = 'Stop'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Write-Host 'Downloading Node.js %NODE_VERSION%...' -ForegroundColor Cyan; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%BIN_DIR%\node_pkg.zip' -UserAgent 'Mozilla/5.0'; Write-Host 'Extracting files...' -ForegroundColor Cyan; if (Test-Path '%BIN_DIR%\temp') { Remove-Item '%BIN_DIR%\temp' -Recurse -Force }; Expand-Archive -Path '%BIN_DIR%\node_pkg.zip' -DestinationPath '%BIN_DIR%\temp' -Force; $extractedDir = Get-ChildItem -Path '%BIN_DIR%\temp' -Directory | Select-Object -First 1; Move-Item -Path \"$($extractedDir.FullName)\*\" -Destination '%BIN_DIR%' -Force; Remove-Item -Path '%BIN_DIR%\temp' -Recurse -Force; Remove-Item -Path '%BIN_DIR%\node_pkg.zip' -Force; Write-Host 'Setup finished successfully.' -ForegroundColor Green; } catch { Write-Host 'Error during setup: ' + $_.Exception.Message -ForegroundColor Red; exit 1; } }"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to download/extract Node.js automatically.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

SET "PATH=%BIN_DIR%;%PATH%"

:LINT_CHECK
:: 4. Install Dependencies if node_modules is missing
if not exist "%~dp0node_modules" (
    echo [INFO] First run detected. Installing dependencies...
    call npm install
)

:: 5. Launch Server
echo [SUCCESS] Starting Financial Hub...
echo.
node server.js
exit /b 0
