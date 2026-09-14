@echo off
chcp 65001 > nul
title Cennik Lamp Samochodowych - Wersja Desktopowa
if not exist node_modules (
    echo [1/2] Instalowanie bibliotek (npm install)...
    call npm install
)
echo [2/2] Uruchamianie aplikacji w oknie desktopowym...
call npm run electron:dev
pause
