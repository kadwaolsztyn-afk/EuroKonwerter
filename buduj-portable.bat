@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title Generator Wersji Portable (.EXE) - Cennik Lamp Samochodowych

echo =======================================================================
echo   GENERATOR WERSJI PRZENOSNEJ PORTABLE (.EXE BEZ INSTALACJI)
echo   Cennik Lamp Samochodowych
echo =======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [BLAD KRYTYCZNY] Nie wykryto srodowiska Node.js na tym komputerze!
    echo Zainstaluj Node.js ze strony: https://nodejs.org
    pause
    exit /b 1
)

if not exist node_modules (
    echo [KROK 1/3] Pobieranie bibliotek (npm install)...
    call npm install
)

echo [KROK 2/3] Kompilacja aplikacji...
call npm run build

echo [KROK 3/3] Pakowanie do pliku Portable .EXE...
call npx electron-builder --win portable --x64

if %errorlevel% neq 0 (
    echo [BLAD] Nie udalo sie utworzyc pliku portable.
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================================
echo   SUKCES! Utworzono wersje przenosna w folderze \release
echo =======================================================================
if exist release start "" explorer "release"
pause
