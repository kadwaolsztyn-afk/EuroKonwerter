@echo off
chcp 65001 > nul
title Uruchamianie - Cennik Lamp Samochodowych

set APP_URL=https://ais-dev-q6icxcakcnvkud2eyjq3fr-175691408196.europe-west2.run.app

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL%
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL%
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=%APP_URL%
) else (
    start "" %APP_URL%
)
