@echo off
chcp 65001 > nul
title Cennik Konwersji Lamp i Multimediow (Wersja Przenosna)
color 0b

echo ===============================================================================
echo     CENNIK KONWERSJI LAMP I MULTIMEDIOW - WERSJA W 100%% PRZENOSNA (PORTABLE)
echo     Wszystkie pliki bazy (data-catalog.json) oraz zdjecia (/uploads)
echo     znajduja sie w tym folderze. Brak wpisow do rejestru i AppData.
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Sprawdzanie srodowiska Node.js w systemie...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [UWAGA] Nie wykryto polecenia 'node' w sciezce systemowej PATH.
    echo Jesli uruchamiasz program po raz pierwszy na nowym komputerze:
    echo 1. Zainstaluj darmowy Node.js LTS (https://nodejs.org) lub
    echo 2. Umiesc plik 'node.exe' bezposrednio w tym folderze.
    echo.
    pause
    exit /b 1
)

echo [2/3] Uruchamianie lokalnego silnika cennika z biezacego folderu...

if exist "dist\server.cjs" (
    start /min "Cennik Serwer" node dist/server.cjs
) else if exist "server.ts" (
    start /min "Cennik Serwer" npx tsx server.ts
) else (
    echo [BLAD] Nie znaleziono pliku serwera (dist/server.cjs lub server.ts)!
    pause
    exit /b 1
)

echo [3/3] Czekam na start serwera i otwieram przegladarke...
timeout /t 2 /nobreak > nul

start http://localhost:3000

echo.
echo ===============================================================================
echo Program dziala w pelni lokalnie z tego folderu:
echo %~dp0
echo.
echo Zdjecia zapisywane sa w: %~dp0uploads\
echo Baza danych zapisywana jest w: %~dp0data-catalog.json
echo.
echo Aby zakonczyc prace z programem, po prostu zamknij to okno konsoli.
echo ===============================================================================
pause
