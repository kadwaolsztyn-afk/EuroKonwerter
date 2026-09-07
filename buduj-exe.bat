@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title Kreator Instalatora Windows (EXE) - Cennik Lamp Samochodowych

echo =======================================================================
echo   GENERATOR INSTALATORA WINDOWS (.EXE) - Cennik Lamp Samochodowych
echo   Obsluga systemow: Windows 64-bit (x64) oraz 32-bit (x32 / x86)
echo =======================================================================
echo.

:: 1. Sprawdzenie srodowiska Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [BLAD KRYTYCZNY] Nie wykryto srodowiska Node.js na tym komputerze!
    echo.
    echo Aby moc skompilowac program do pliku instalacyjnego .EXE:
    echo 1. Pobierz i zainstaluj bezplatne srodowisko Node.js (wersja LTS) ze strony:
    echo    https://nodejs.org
    echo 2. Po zainstalowaniu uruchom ponownie komputer i wlacz ten plik ponownie.
    echo.
    echo =======================================================================
    pause
    exit /b 1
)

:: 2. Sprawdzenie wersji Node i NPM
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [OK] Wykryto Node.js (%NODE_VER%) oraz NPM (%NPM_VER%).
echo.

:: 3. Sprawdzenie zaleznosci (node_modules)
if not exist node_modules (
    echo [KROK 1/3] Pobieranie wymaganych bibliotek (npm install)...
    echo To moze potrwac 1-2 minuty przy pierwszym uruchomieniu...
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo [BLAD] Nie udalo sie zainstalowac bibliotek przez 'npm install'.
        echo Sprawdz polaczenie z internetem lub uprawnienia do folderu.
        pause
        exit /b !errorlevel!
    )
) else (
    echo [KROK 1/3] Biblioteki sa juz zainstalowane.
)

:: 4. Budowanie aplikacji Vite
echo.
echo [KROK 2/3] Kompilacja kodu zrodlowego aplikacji (Vite + TypeScript)...
call npm run build
if !errorlevel! neq 0 (
    echo.
    echo [BLAD] Wystapil problem podczas kompilacji aplikacji (npm run build).
    echo Sprawdz powyzsze komunikaty bledow.
    pause
    exit /b !errorlevel!
)

:: Menu wyboru architektury
echo.
echo =======================================================================
echo   WYBIERZ WERSJE INSTALATORA DO WYGENEROWANIA:
echo =======================================================================
echo   [1] Obie wersje: Windows 64-bit (x64) ORAZ 32-bit (x32/x86) [ZALECANE]
echo   [2] Tylko Windows 64-bit (x64)
echo   [3] Tylko Windows 32-bit (x32 / x86)
echo   [4] Wersje przenosne Portable .EXE (bez instalatora) dla x64 i x32
echo   [5] Wszystkie pakiety (Instalatory NSIS + Wersje Portable)
echo =======================================================================
set /p WYBOR="Wpisz numer (1, 2, 3, 4 lub 5) i nacisnij ENTER [Domyslnie 1]: "

if "%WYBOR%"=="" set WYBOR=1
if "%WYBOR%"=="1" goto BUILD_BOTH
if "%WYBOR%"=="2" goto BUILD_X64
if "%WYBOR%"=="3" goto BUILD_X32
if "%WYBOR%"=="4" goto BUILD_PORTABLE
if "%WYBOR%"=="5" goto BUILD_ALL
goto BUILD_BOTH

:BUILD_BOTH
echo.
echo [KROK 3/3] Pakowanie instalatorow dla Windows x64 i x32 (NSIS Installer)...
call npx electron-builder --win nsis --x64 --ia32
goto FINISH

:BUILD_X64
echo.
echo [KROK 3/3] Pakowanie instalatora dla Windows 64-bit (x64)...
call npx electron-builder --win nsis --x64
goto FINISH

:BUILD_X32
echo.
echo [KROK 3/3] Pakowanie instalatora dla Windows 32-bit (x32 / x86)...
call npx electron-builder --win nsis --ia32
goto FINISH

:BUILD_PORTABLE
echo.
echo [KROK 3/3] Pakowanie wersji Portable (x64 i x32)...
call npx electron-builder --win portable --x64 --ia32
goto FINISH

:BUILD_ALL
echo.
echo [KROK 3/3] Pakowanie wszystkich wersji (Instalatory + Portable)...
call npx electron-builder --win nsis portable --x64 --ia32
goto FINISH

:FINISH
if %errorlevel% neq 0 (
    echo.
    echo [BLAD] Nie udalo sie utworzyc instalatora .EXE.
    echo Mozliwe przyczyny:
    echo 1. Program antywirusowy zablokowal tworzenie pliku .exe w folderze \release
    echo 2. Brak polaczenia z internetem przy pierwszym pobieraniu pakietu Electron
    echo 3. Plik .exe z poprzedniej instalacji jest otwarty w tle
    echo.
    pause
    exit /b %errorlevel%
)

:: 6. Zakonczenie z sukcesem
echo.
echo =======================================================================
echo   SUKCES! Gotowy instalator Windows (.EXE) zostal pomyslnie utworzony!
echo =======================================================================
echo.
echo Pliki instalacyjne (.EXE) znajduja sie w folderze:
echo   \release\
echo.
echo Znajdziesz tam m.in.:
echo   - Cennik Lamp Samochodowych-Setup-x64.exe   (Dla systemow 64-bitowych)
echo   - Cennik Lamp Samochodowych-Setup-ia32.exe  (Dla systemow 32-bitowych)
echo.
echo Dzialanie instalatora (jak Office / typowy program Windows):
echo   * Kreator instalacji z wyborem folderu
echo   * Automatyczne tworzenie skrotu na Pulpicie i w Menu Start
echo   * Samodzielna ikona programu i pelny instalator/deinstalator
echo =======================================================================
echo.

if exist release (
    echo Otwieranie folderu z gotowym plikiem instalacyjnym...
    start "" explorer "release"
)

echo.
pause
