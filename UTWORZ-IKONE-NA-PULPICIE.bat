@echo off
chcp 65001 > nul
title Tworzenie ikony na Pulpicie - Cennik Lamp Samochodowych

echo =======================================================================
echo   TWORZENIE SKROTU PROGRAMU NA PULPICIE WINDOWS
echo =======================================================================
echo.

set APP_URL=https://ais-dev-q6icxcakcnvkud2eyjq3fr-175691408196.europe-west2.run.app
set SCRIPT_DIR=%~dp0

echo Tworzenie skrótu z oryginalną ikoną programu...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $appDataDir = Join-Path $env:LOCALAPPDATA 'CennikLamp'; if (-not (Test-Path $appDataDir)) { New-Item -ItemType Directory -Path $appDataDir -Force | Out-Null }; $localIco = Join-Path $appDataDir 'icon.ico'; $srcIco = Join-Path '%SCRIPT_DIR%' 'electron\icon.ico'; if (Test-Path $srcIco) { Copy-Item -Path $srcIco -Destination $localIco -Force } elseif (-not (Test-Path $localIco)) { try { (New-Object Net.WebClient).DownloadFile('%APP_URL%/favicon.svg', (Join-Path $appDataDir 'icon.svg')) } catch {} }; $wshell = New-Object -ComObject WScript.Shell; $shortcut = $wshell.CreateShortcut(\"$desktop\Cennik Lamp Samochodowych.lnk\"); $edgePath = \"$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe\"; if (-not (Test-Path $edgePath)) { $edgePath = \"$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\" }; if (Test-Path $edgePath) { $shortcut.TargetPath = $edgePath; $shortcut.Arguments = \"--app=%APP_URL%\"; } else { $shortcut.TargetPath = '%APP_URL%'; }; if (Test-Path $localIco) { $shortcut.IconLocation = \"$localIco,0\"; } elseif (Test-Path $srcIco) { $shortcut.IconLocation = \"$srcIco,0\"; }; $shortcut.Description = 'Cennik i Katalog Modyfikacji Lamp Samochodowych'; $shortcut.Save(); Write-Host 'Skrót z ikoną został zapisany na Pulpicie!'"

echo.
echo =======================================================================
echo   SUKCES! Ikona z grafika i aktualna wersja bazy jest na Pulpicie!
echo =======================================================================
echo.
pause

