@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title Budowanie Instalatorow Windows (x64 oraz x32) - Cennik Lamp Samochodowych

echo =======================================================================
echo   AUTOMATYCZNY GENERATOR INSTALATOROW WINDOWS (.EXE)
echo   Pakiety dla obu architektur: 64-bit (x64) oraz 32-bit (x32 / ia32)
echo =======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [BLAD KRYTYCZNY] Nie wykryto srodowiska Node.js!
    echo Pobierz i zainstaluj Node.js (LTS) ze strony: https://nodejs.org
    pause
    exit /b 1
)

if not exist node_modules (
    echo [KROK 1/3] Instalacja bibliotek...
    call npm install
)

echo.
echo [KROK 2/3] Kompilacja aplikacji...
call npm run build
if %errorlevel% neq 0 (
    echo [BLAD] Blad kompilacji projektu.
    pause
    exit /b %errorlevel%
)

echo.
echo [KROK 3/3] Pakowanie instalatorow NSIS (.exe) dla x64 i x32...
call npx electron-builder --win nsis --x64 --ia32
if %errorlevel% neq 0 (
    echo [BLAD] Blad podczas tworzenia instalatora.
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================================
echo   GOTOWE! Utworzono pliki instalacyjne:
echo   - release\Cennik Lamp Samochodowych-Setup-x64.exe  (Wersja 64-bit)
echo   - release\Cennik Lamp Samochodowych-Setup-ia32.exe (Wersja 32-bit)
echo =======================================================================
echo.

if exist release start "" explorer "release"
pause
